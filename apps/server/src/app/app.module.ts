import { ConfigKitModule } from '@brickam/config-kit';
import { DbKitModule } from '@brickam/db-kit';
import { I18nKitModule } from '@brickam/i18n-kit';
import { ServerKitModule } from '@brickam/server-kit';
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
        HealthModule,
    ],
})
export class AppModule {}
