import { AiKitModule } from '@brickam/ai-kit';
import { AiSearchModule } from '@brickam/ai-search';
import { AuthModule } from '@brickam/auth';
import { CatalogModule } from '@brickam/catalog';
import { ChatModule } from '@brickam/chat';
import { ConfigKitModule } from '@brickam/config-kit';
import { CurrencyModule } from '@brickam/currency';
import { DbKitModule } from '@brickam/db-kit';
import { I18nKitModule } from '@brickam/i18n-kit';
import { InvoicesModule } from '@brickam/invoices';
import { LoyaltyModule } from '@brickam/loyalty';
import { NotificationsModule } from '@brickam/notifications';
import { OrdersModule } from '@brickam/orders';
import { PaymentsModule } from '@brickam/payments';
import { ReviewsModule } from '@brickam/reviews';
import { ServerKitModule } from '@brickam/server-kit';
import { TemplatesModule } from '@brickam/templates';
import { UsersModule } from '@brickam/users';
import { WishlistModule } from '@brickam/wishlist';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from './health/health.module';

@Module({
    imports: [
        // Конфиг грузится и валидируется первым (fail-fast).
        ConfigKitModule.forRoot(),
        I18nKitModule,
        DbKitModule.forRoot(),
        // Планировщик для дневного обновления курсов валют (@Cron в currency).
        ScheduleModule.forRoot(),
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
        HealthModule,
    ],
})
export class AppModule {}
