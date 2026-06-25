import { ValidationException } from '@brickam/core-kit';
import { Permission } from '@brickam/domain-kit';
import { Auth, CurrentVendor, type VendorContext } from '@brickam/server-kit';
import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { AnalyticsDashboard } from '../@types';
import { AnalyticsService } from './analytics.service';
import { AnalyticsExportService } from './analytics-export.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

/** Период по умолчанию, если from/to не заданы (последние 30 дней). */
const DEFAULT_PERIOD_DAYS = 30;

/**
 * Маршруты аналитики вендора (Foundations §14, Stage 15). Все требуют права
 * `analytics.view` и SCOPED по текущему вендору (@CurrentVendor). Период
 * парсится из ISO; при отсутствии — последние 30 дней.
 */
@ApiTags('analytics')
@Controller('analytics')
@Auth(Permission.AnalyticsView)
export class AnalyticsController {
    constructor(
        private readonly analyticsService: AnalyticsService,
        private readonly exportService: AnalyticsExportService,
    ) {}

    /** Извлекает vendorId текущего вендора (нет вендора → ValidationException). */
    private requireVendorId(vendor: VendorContext | undefined): string {
        if (!vendor) {
            throw new ValidationException('errors.analytics.noVendor');
        }
        return vendor.id;
    }

    /** Разбирает период из query: ISO from/to или последние 30 дней. */
    private resolvePeriod(query: AnalyticsQueryDto): { from: Date; to: Date } {
        const to = query.to ? new Date(query.to) : new Date();
        const from = query.from
            ? new Date(query.from)
            : new Date(to.getTime() - DEFAULT_PERIOD_DAYS * 24 * 60 * 60 * 1000);
        return { from, to };
    }

    /** Дашборд аналитики вендора за период. */
    @Get('dashboard')
    @ApiOkResponse({ description: 'Дашборд аналитики вендора' })
    async dashboard(
        @CurrentVendor() vendor: VendorContext | undefined,
        @Query() query: AnalyticsQueryDto,
    ): Promise<AnalyticsDashboard> {
        const vendorId = this.requireVendorId(vendor);
        const { from, to } = this.resolvePeriod(query);
        return this.analyticsService.dashboard(vendorId, from, to);
    }

    /** Экспорт дашборда в CSV (attachment). */
    @Get('export.csv')
    @ApiOkResponse({ description: 'CSV-экспорт аналитики' })
    async exportCsv(
        @CurrentVendor() vendor: VendorContext | undefined,
        @Query() query: AnalyticsQueryDto,
        @Res() res: Response,
    ): Promise<void> {
        const vendorId = this.requireVendorId(vendor);
        const { from, to } = this.resolvePeriod(query);
        const dashboard = await this.analyticsService.dashboard(vendorId, from, to);
        const csv = this.exportService.exportCsv(dashboard);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="analytics.csv"');
        res.send(csv);
    }

    /** Экспорт дашборда в XLSX (attachment). */
    @Get('export.xlsx')
    @ApiOkResponse({ description: 'XLSX-экспорт аналитики' })
    async exportXlsx(
        @CurrentVendor() vendor: VendorContext | undefined,
        @Query() query: AnalyticsQueryDto,
        @Res() res: Response,
    ): Promise<void> {
        const vendorId = this.requireVendorId(vendor);
        const { from, to } = this.resolvePeriod(query);
        const dashboard = await this.analyticsService.dashboard(vendorId, from, to);
        const buffer = await this.exportService.exportXlsx(dashboard);
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader('Content-Disposition', 'attachment; filename="analytics.xlsx"');
        res.send(buffer);
    }
}
