import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppConfigService } from '@brickam/config-kit';
import { Logger, VERSION_NEUTRAL, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as Sentry from '@sentry/node';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app/app.module';
import { RedisIoAdapter } from './app/ws/redis-io.adapter';

/**
 * Подключает Socket.IO Redis-adapter для горизонтального масштабирования
 * WS-чата (события рассылаются между инстансами через Redis). Активируется
 * только в проде ИЛИ при явном `WS_REDIS_ADAPTER=1` и вне тестов — в dev/тестах
 * остаётся дефолтный in-memory адаптер. При недоступности Redis НЕ роняем
 * приложение: логируем предупреждение и продолжаем одноинстансово.
 */
async function setupWsRedisAdapter(
    app: Awaited<ReturnType<typeof NestFactory.create>>,
    config: AppConfigService,
): Promise<void> {
    const explicit = process.env.WS_REDIS_ADAPTER === '1';
    const isTest = process.env.NODE_ENV === 'test';
    if (!((config.isProduction || explicit) && !isTest)) {
        return;
    }
    try {
        const adapter = new RedisIoAdapter(app);
        await adapter.connectToRedis(config.queue.redisUrl);
        app.useWebSocketAdapter(adapter);
        Logger.log('Socket.IO Redis-adapter подключён (горизонтальное масштабирование)', 'WS');
    } catch (error) {
        // Фолбэк: чат продолжит работать на дефолтном in-memory адаптере (один инстанс).
        Logger.warn(
            `Socket.IO Redis-adapter не подключён, используется in-memory: ${String(error)}`,
            'WS',
        );
    }
}

/** Инициализирует Sentry, если задан SENTRY_DSN (иначе capture — no-op). */
function initSentry(): void {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) {
        return;
    }
    Sentry.init({
        dsn,
        environment: process.env.NODE_ENV ?? 'development',
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    });
}

const buildSwaggerConfig = () =>
    new DocumentBuilder()
        .setTitle('Brickam API')
        .setDescription('API маркетплейса стройматериалов Brickam')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('health')
        .build();

async function bootstrap(): Promise<void> {
    // Sentry — как можно раньше, до создания приложения (ловит и ошибки старта).
    initSentry();

    // Режим экспорта OpenAPI для генерации api-kit: preview-граф без подключения к Mongo.
    const exporting = process.env.OPENAPI_EXPORT === '1';
    if (exporting) {
        const previewApp = await NestFactory.create(AppModule, { preview: true, logger: false });
        // Префикс мирорится с дефолтом config.server.globalPrefix (провайдеры в preview не подняты).
        previewApp.setGlobalPrefix('api');
        const document = SwaggerModule.createDocument(previewApp, buildSwaggerConfig());
        const outPath = resolve(process.cwd(), 'packages/api-kit/openapi.json');
        writeFileSync(outPath, JSON.stringify(document, null, 2));
        await previewApp.close();
        Logger.log(`OpenAPI экспортирован → ${outPath}`, 'OpenAPI');
        return;
    }

    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    // Структурное JSON-логирование (pino): traceId/уровень/контекст в каждой строке;
    // секреты редактируются (см. LoggerModule в app.module).
    app.useLogger(app.get(PinoLogger));
    const config = app.get(AppConfigService);
    const { globalPrefix, port, corsOrigins } = config.server;

    // Security-заголовки (CSP/HSTS/X-Frame-Options и т.п.). API отдаёт JSON,
    // поэтому CSP-директивы для документов не критичны — Swagger UI оставляем рабочим.
    app.use(helmet({ contentSecurityPolicy: false }));
    // Парсинг cookie для httpOnly-токенов (dual-mode: cookie ИЛИ Bearer-заголовок).
    app.use(cookieParser());
    // Корректный клиентский IP за прокси — для throttler/логов.
    (app.getHttpAdapter().getInstance() as { set: (k: string, v: unknown) => void }).set(
        'trust proxy',
        1,
    );
    // Грейсфул-шатдаун: закрытие Mongo/Redis/BullMQ по SIGTERM/SIGINT.
    app.enableShutdownHooks();

    // WS-чат: Redis-adapter для масштабирования (прозрачен для ChatGateway).
    await setupWsRedisAdapter(app, config);

    app.setGlobalPrefix(globalPrefix);
    // Версионирование API через URI: маршруты доступны как /api/v1/... (основная
    // версия) И как /api/... (VERSION_NEUTRAL — обратная совместимость без рипла
    // для текущих клиентов; новые/внешние потребители используют явный /v1).
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: ['1', VERSION_NEUTRAL] });
    app.enableCors({ origin: corsOrigins, credentials: true });

    const document = SwaggerModule.createDocument(app, buildSwaggerConfig());
    SwaggerModule.setup(`${globalPrefix}/docs`, app, document, {
        jsonDocumentUrl: `${globalPrefix}/docs-json`,
    });

    await app.listen(port);
    Logger.log(
        `🚀 Brickam API: http://localhost:${port}/${globalPrefix} (docs: /${globalPrefix}/docs)`,
        'Bootstrap',
    );
}

void bootstrap();
