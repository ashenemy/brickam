import { OrdersAnalyticsContract } from '@brickam/domain-kit';
import { Injectable } from '@nestjs/common';
import type { AnalyticsDashboard } from '../@types';

/** TTL кеша дашборда, мс. Повторный идентичный запрос в окне TTL не дёргает контракт. */
const CACHE_TTL_MS = 60_000;

/** Количество товаров в топе дашборда. */
const TOP_PRODUCTS_LIMIT = 10;

/** Запись in-memory кеша дашборда. */
type CacheEntry = {
    data: AnalyticsDashboard;
    at: number;
};

/**
 * Сервис аналитики вендора (Foundations §14, Stage 15). Зависит только от
 * OrdersAnalyticsContract (граница feature). Все запросы SCOPED по vendorId.
 * Дашборд кешируется in-memory по ключу vendorId+from+to на TTL.
 */
@Injectable()
export class AnalyticsService {
    private readonly cache = new Map<string, CacheEntry>();

    constructor(private readonly orders: OrdersAnalyticsContract) {}

    /**
     * Собирает дашборд вендора за период: параллельно сводка, временной ряд,
     * воронка статусов и топ-10 товаров. Идентичный запрос в окне TTL отдаётся
     * из кеша без обращения к контракту.
     */
    async dashboard(vendorId: string, from: Date, to: Date): Promise<AnalyticsDashboard> {
        const key = `${vendorId}|${from.getTime()}|${to.getTime()}`;
        const cached = this.cache.get(key);
        const now = Date.now();
        if (cached && now - cached.at < CACHE_TTL_MS) {
            return cached.data;
        }

        const [summary, revenueSeries, statusFunnel, topProducts] = await Promise.all([
            this.orders.vendorSummary(vendorId, from, to),
            this.orders.revenueSeries(vendorId, from, to),
            this.orders.statusFunnel(vendorId),
            this.orders.topProducts(vendorId, TOP_PRODUCTS_LIMIT),
        ]);

        const data: AnalyticsDashboard = { summary, revenueSeries, statusFunnel, topProducts };
        this.cache.set(key, { data, at: now });
        return data;
    }
}
