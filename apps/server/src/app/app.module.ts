import { AuthModule } from '@brickam/auth';
import { CatalogModule } from '@brickam/catalog';
import { ConfigKitModule } from '@brickam/config-kit';
import { DbKitModule } from '@brickam/db-kit';
import { I18nKitModule } from '@brickam/i18n-kit';
import { NotificationsModule } from '@brickam/notifications';
import { OrdersModule } from '@brickam/orders';
import { PaymentsModule } from '@brickam/payments';
import { ServerKitModule } from '@brickam/server-kit';
import { TemplatesModule } from '@brickam/templates';
import { UsersModule } from '@brickam/users';
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';

@Module({
    imports: [
        // Конфиг грузится и валидируется первым (fail-fast).
        ConfigKitModule.forRoot(),
        I18nKitModule,
        DbKitModule.forRoot(),
        // Глобальные interceptors/filter/pipe платформы.
        ServerKitModule.forRoot(),
        // Фичи: templates → notifications → users → auth (контракты/guard'ы глобальные).
        TemplatesModule,
        NotificationsModule,
        UsersModule,
        AuthModule,
        CatalogModule,
        PaymentsModule,
        OrdersModule,
        HealthModule,
    ],
})
export class AppModule {}
