import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppConfigService } from '@brickam/config-kit';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app/app.module';

const buildSwaggerConfig = () =>
    new DocumentBuilder()
        .setTitle('BuildHub API')
        .setDescription('API маркетплейса стройматериалов BuildHub')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('health')
        .build();

async function bootstrap(): Promise<void> {
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

    app.setGlobalPrefix(globalPrefix);
    app.enableCors({ origin: corsOrigins, credentials: true });

    const document = SwaggerModule.createDocument(app, buildSwaggerConfig());
    SwaggerModule.setup(`${globalPrefix}/docs`, app, document, {
        jsonDocumentUrl: `${globalPrefix}/docs-json`,
    });

    await app.listen(port);
    Logger.log(
        `🚀 BuildHub API: http://localhost:${port}/${globalPrefix} (docs: /${globalPrefix}/docs)`,
        'Bootstrap',
    );
}

void bootstrap();
