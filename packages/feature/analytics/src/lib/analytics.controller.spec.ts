import { ValidationException } from '@brickam/core-kit';
import type { VendorContext } from '@brickam/server-kit';
import type { Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnalyticsDashboard } from '../@types';
import { AnalyticsController } from './analytics.controller';
import type { AnalyticsService } from './analytics.service';
import type { AnalyticsExportService } from './analytics-export.service';

const dashboard: AnalyticsDashboard = {
    summary: { gmv: 1000, orders: 4, avgCheck: 250 },
    revenueSeries: [{ date: '2026-06-01', gmv: 1000, orders: 4 }],
    statusFunnel: [{ status: 'delivered', count: 4 }],
    topProducts: [{ productId: 'p1', qty: 10, revenue: 1000 }],
};

const vendor: VendorContext = { id: 'v1' };

const makeRes = () => {
    const res = {
        setHeader: vi.fn(),
        send: vi.fn(),
    };
    return res as unknown as Response & {
        setHeader: ReturnType<typeof vi.fn>;
        send: ReturnType<typeof vi.fn>;
    };
};

describe('AnalyticsController', () => {
    let analyticsService: { dashboard: ReturnType<typeof vi.fn> };
    let exportService: {
        exportCsv: ReturnType<typeof vi.fn>;
        exportXlsx: ReturnType<typeof vi.fn>;
    };
    let controller: AnalyticsController;

    beforeEach(() => {
        analyticsService = { dashboard: vi.fn().mockResolvedValue(dashboard) };
        exportService = {
            exportCsv: vi.fn().mockReturnValue('date,gmv,orders\n2026-06-01,1000,4'),
            exportXlsx: vi.fn().mockResolvedValue(Buffer.from('xlsx')),
        };
        controller = new AnalyticsController(
            analyticsService as unknown as AnalyticsService,
            exportService as unknown as AnalyticsExportService,
        );
    });

    it('dashboard: scoped по vendorId, период из ISO query', async () => {
        const result = await controller.dashboard(vendor, {
            from: '2026-06-01T00:00:00.000Z',
            to: '2026-06-30T00:00:00.000Z',
        });

        expect(result).toBe(dashboard);
        const [vendorId, from, to] = analyticsService.dashboard.mock.calls[0] as [
            string,
            Date,
            Date,
        ];
        expect(vendorId).toBe('v1');
        expect(from.toISOString()).toBe('2026-06-01T00:00:00.000Z');
        expect(to.toISOString()).toBe('2026-06-30T00:00:00.000Z');
    });

    it('dashboard: без query — последние 30 дней (from < to)', async () => {
        await controller.dashboard(vendor, {});

        const [, from, to] = analyticsService.dashboard.mock.calls[0] as [string, Date, Date];
        const diffDays = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
        expect(Math.round(diffDays)).toBe(30);
    });

    it('dashboard: нет вендора → ValidationException', async () => {
        await expect(controller.dashboard(undefined, {})).rejects.toBeInstanceOf(
            ValidationException,
        );
    });

    it('exportCsv: ставит заголовки text/csv + attachment и шлёт csv', async () => {
        const res = makeRes();
        await controller.exportCsv(vendor, {}, res);

        expect(exportService.exportCsv).toHaveBeenCalledWith(dashboard);
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
        expect(res.setHeader).toHaveBeenCalledWith(
            'Content-Disposition',
            'attachment; filename="analytics.csv"',
        );
        expect(res.send).toHaveBeenCalledWith('date,gmv,orders\n2026-06-01,1000,4');
    });

    it('exportXlsx: ставит spreadsheet Content-Type и шлёт Buffer', async () => {
        const res = makeRes();
        await controller.exportXlsx(vendor, {}, res);

        expect(exportService.exportXlsx).toHaveBeenCalledWith(dashboard);
        expect(res.setHeader).toHaveBeenCalledWith(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        expect(res.send).toHaveBeenCalledWith(Buffer.from('xlsx'));
    });

    it('exportCsv: нет вендора → ValidationException', async () => {
        const res = makeRes();
        await expect(controller.exportCsv(undefined, {}, res)).rejects.toBeInstanceOf(
            ValidationException,
        );
    });
});
