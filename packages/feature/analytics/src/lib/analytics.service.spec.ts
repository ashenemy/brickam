import type { OrdersAnalyticsContract } from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from './analytics.service';

const makeOrders = () => ({
    vendorSummary: vi.fn().mockResolvedValue({ gmv: 1000, orders: 4, avgCheck: 250 }),
    revenueSeries: vi.fn().mockResolvedValue([{ date: '2026-06-01', gmv: 1000, orders: 4 }]),
    statusFunnel: vi.fn().mockResolvedValue([{ status: 'delivered', count: 4 }]),
    topProducts: vi.fn().mockResolvedValue([{ productId: 'p1', qty: 10, revenue: 1000 }]),
});

describe('AnalyticsService', () => {
    let orders: ReturnType<typeof makeOrders>;
    let service: AnalyticsService;
    const from = new Date('2026-06-01T00:00:00.000Z');
    const to = new Date('2026-06-30T00:00:00.000Z');

    beforeEach(() => {
        orders = makeOrders();
        service = new AnalyticsService(orders as unknown as OrdersAnalyticsContract);
    });

    it('dashboard собирает все 4 секции', async () => {
        const dashboard = await service.dashboard('v1', from, to);

        expect(dashboard.summary).toEqual({ gmv: 1000, orders: 4, avgCheck: 250 });
        expect(dashboard.revenueSeries).toEqual([{ date: '2026-06-01', gmv: 1000, orders: 4 }]);
        expect(dashboard.statusFunnel).toEqual([{ status: 'delivered', count: 4 }]);
        expect(dashboard.topProducts).toEqual([{ productId: 'p1', qty: 10, revenue: 1000 }]);
    });

    it('scoped: контракт зовётся с переданным vendorId и периодом, топ-10', async () => {
        await service.dashboard('vendor-42', from, to);

        expect(orders.vendorSummary).toHaveBeenCalledWith('vendor-42', from, to);
        expect(orders.revenueSeries).toHaveBeenCalledWith('vendor-42', from, to);
        expect(orders.statusFunnel).toHaveBeenCalledWith('vendor-42');
        expect(orders.topProducts).toHaveBeenCalledWith('vendor-42', 10);
    });

    it('кеш: второй идентичный вызов НЕ дёргает контракт', async () => {
        await service.dashboard('v1', from, to);
        await service.dashboard('v1', from, to);

        expect(orders.vendorSummary).toHaveBeenCalledTimes(1);
        expect(orders.revenueSeries).toHaveBeenCalledTimes(1);
        expect(orders.statusFunnel).toHaveBeenCalledTimes(1);
        expect(orders.topProducts).toHaveBeenCalledTimes(1);
    });

    it('кеш по ключу: другой vendor/период дёргает контракт заново', async () => {
        await service.dashboard('v1', from, to);
        await service.dashboard('v2', from, to);
        await service.dashboard('v1', from, new Date('2026-07-01T00:00:00.000Z'));

        expect(orders.vendorSummary).toHaveBeenCalledTimes(3);
    });

    it('кеш протухает по TTL и дёргает контракт повторно', async () => {
        const base = 1_000_000;
        const spy = vi.spyOn(Date, 'now');
        spy.mockReturnValue(base);
        await service.dashboard('v1', from, to);
        // Сдвигаем «время» за пределы TTL (60с).
        spy.mockReturnValue(base + 61_000);
        await service.dashboard('v1', from, to);

        expect(orders.vendorSummary).toHaveBeenCalledTimes(2);
        spy.mockRestore();
    });
});
