import { Module } from '@nestjs/common';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsExportService } from './analytics-export.service';

/**
 * Модуль аналитики (Foundations §14, Stage 15). НЕ @Global — orders приходит
 * глобально по OrdersAnalyticsContract. Зависит только от kit/domain
 * (граница feature → не импортирует другие feature).
 */
@Module({
    controllers: [AnalyticsController, AdminAnalyticsController],
    providers: [AnalyticsService, AnalyticsExportService],
    exports: [AnalyticsService, AnalyticsExportService],
})
export class AnalyticsModule {}
