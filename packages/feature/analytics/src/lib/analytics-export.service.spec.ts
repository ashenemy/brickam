import { beforeEach, describe, expect, it } from 'vitest';
import type { AnalyticsDashboard } from '../@types';
import { AnalyticsExportService } from './analytics-export.service';

const dashboard: AnalyticsDashboard = {
    summary: { gmv: 1500, orders: 6, avgCheck: 250 },
    revenueSeries: [
        { date: '2026-06-01', gmv: 1000, orders: 4 },
        { date: '2026-06-02', gmv: 500, orders: 2 },
    ],
    statusFunnel: [{ status: 'delivered', count: 6 }],
    topProducts: [{ productId: 'p1', qty: 10, revenue: 1000 }],
};

describe('AnalyticsExportService', () => {
    let service: AnalyticsExportService;

    beforeEach(() => {
        service = new AnalyticsExportService();
    });

    describe('exportCsv', () => {
        it('содержит заголовок, строки временного ряда и сводку', () => {
            const csv = service.exportCsv(dashboard);

            expect(csv).toContain('date,gmv,orders');
            expect(csv).toContain('2026-06-01,1000,4');
            expect(csv).toContain('2026-06-02,500,2');
            expect(csv).toContain('gmv,orders,avgCheck');
            expect(csv).toContain('1500,6,250');
        });
    });

    describe('exportXlsx', () => {
        it('возвращает непустой Buffer (smoke)', async () => {
            const buffer = await service.exportXlsx(dashboard);

            expect(Buffer.isBuffer(buffer)).toBe(true);
            expect(buffer.length).toBeGreaterThan(0);
        });
    });
});
