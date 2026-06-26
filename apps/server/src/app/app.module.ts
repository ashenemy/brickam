import { AiAssistantModule } from '@brickam/ai-assistant';
import { AiKitModule } from '@brickam/ai-kit';
import { AiSearchModule } from '@brickam/ai-search';
import { AnalyticsModule } from '@brickam/analytics';
import { AuditModule } from '@brickam/audit';
import { AuthModule } from '@brickam/auth';
import { CatalogModule } from '@brickam/catalog';
import { ChatModule } from '@brickam/chat';
import { AppConfigService, ConfigKitModule } from '@brickam/config-kit';
import { CurrencyModule } from '@brickam/currency';
import { DbKitModule } from '@brickam/db-kit';
import { DisputesModule } from '@brickam/disputes';
import { I18nKitModule } from '@brickam/i18n-kit';
import { IdempotencyModule } from '@brickam/idempotency';
import { InvoicesModule } from '@brickam/invoices';
import { LoyaltyModule } from '@brickam/loyalty';
import { NotificationsModule } from '@brickam/notifications';
import { OrdersModule } from '@brickam/orders';
import { PagesModule } from '@brickam/pages';
import { PaymentsModule } from '@brickam/payments';
import { ReviewsModule } from '@brickam/reviews';
import { RedisModule, ServerKitModule } from '@brickam/server-kit';
import { StorageModule } from '@brickam/storage';
import { SubscriptionsModule } from '@brickam/subscriptions';
import { TemplatesModule } from '@brickam/templates';
import { UsersModule } from '@brickam/users';
import { VendorBulkModule } from '@brickam/vendor-bulk';
import { VendorMembersModule } from '@brickam/vendor-members';
import { VendorsModule } from '@brickam/vendors';
import { WishlistModule } from '@brickam/wishlist';
import { BullModule } from '@nestjs/bullmq';
import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './health/health.module';
import { MetricsController } from './observability/metrics.controller';
import { XRayMiddleware } from './observability/xray.middleware';
import { CsrfGuard } from './security/csrf.guard';
import { SeoModule } from './seo/seo.module';

@Module({
    imports: [
        // Конфиг грузится и валидируется первым (fail-fast).
        ConfigKitModule.forRoot(),
        // Структурное JSON-логирование (pino). autoLogging выключен — request-логи
        // даёт существующий LoggingInterceptor (с traceId); секреты редактируются.
        LoggerModule.forRoot({
            pinoHttp: {
                level: process.env['LOG_LEVEL'] ?? 'info',
                autoLogging: false,
                redact: [
                    'req.headers.authorization',
                    'req.headers.cookie',
                    'res.headers["set-cookie"]',
                ],
                ...(process.env['NODE_ENV'] !== 'production'
                    ? { transport: { target: 'pino-pretty', options: { singleLine: true } } }
                    : {}),
            },
        }),
        // Метрики Prometheus → GET /api/metrics (+ дефолтные process/nodejs-метрики).
        PrometheusModule.register({
            controller: MetricsController,
            defaultMetrics: { enabled: true },
        }),
        I18nKitModule,
        DbKitModule.forRoot(),
        // Распределённое key-value (@Global): Redis в проде, in-memory в dev.
        // Используется auth (OTP/refresh-сторы) — мультиинстансная консистентность.
        RedisModule.forRoot(),
        // Идемпотентность мутирующих запросов (глобальный интерсептор по
        // Idempotency-Key для @Idempotent-маршрутов).
        IdempotencyModule,
        // Глобальный rate-limiting (защита от brute-force/DDoS). 100 req/мин на IP
        // по умолчанию; на auth-маршрутах строже (@Throttle в контроллере).
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
        // Планировщик для дневного обновления курсов валют (@Cron в currency).
        ScheduleModule.forRoot(),
        // Очереди BullMQ (фоновые массовые операции vendor-bulk). Подключение —
        // из config.queue.redisUrl; bullmq коннектится лениво (при первой задаче).
        BullModule.forRootAsync({
            inject: [AppConfigService],
            useFactory: (config: AppConfigService) => {
                const url = new URL(config.queue.redisUrl);
                return {
                    connection: {
                        host: url.hostname,
                        port: Number(url.port) || 6379,
                        maxRetriesPerRequest: null,
                    },
                };
            },
        }),
        // Глобальные interceptors/filter/pipe платформы.
        ServerKitModule.forRoot(),
        // AI-провайдеры (@Global): LlmProvider/EmbeddingProvider — до catalog/ai-search.
        AiKitModule,
        // Фичи: templates → notifications → users → auth (контракты/guard'ы глобальные).
        TemplatesModule,
        NotificationsModule,
        UsersModule,
        AuthModule,
        CatalogModule,
        PaymentsModule,
        LoyaltyModule,
        OrdersModule,
        WishlistModule,
        ReviewsModule,
        ChatModule,
        InvoicesModule,
        CurrencyModule,
        AiSearchModule,
        VendorsModule,
        VendorMembersModule,
        SubscriptionsModule,
        VendorBulkModule,
        AnalyticsModule,
        AiAssistantModule,
        AuditModule,
        DisputesModule,
        PagesModule,
        StorageModule,
        HealthModule,
        SeoModule,
    ],
    providers: [
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        // CSRF-защита cookie-аутентификации (Origin-проверка мутаций в проде).
        { provide: APP_GUARD, useClass: CsrfGuard },
    ],
})
export class AppModule implements NestModule {
    /** Глобальная трассировка X-Ray до контроллеров (no-op вне прода). */
    configure(consumer: MiddlewareConsumer): void {
        consumer.apply(XRayMiddleware).forRoutes('*');
    }
}
