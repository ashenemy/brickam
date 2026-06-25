import type {
    AnalyticsBucket,
    AnalyticsSummary,
    PlatformAnalyticsSummary,
    StatusFunnelItem,
    TopProductItem,
} from '../@types';

/**
 * Контракт аналитики заказов (Foundations §14). Реализует `orders` (владелец
 * заказов/саб-заказов); `analytics` зависит только от контракта. Все методы
 * SCOPED по вендору.
 */
export abstract class OrdersAnalyticsContract {
    /** Сводка GMV/заказы/средний чек за период. */
    abstract vendorSummary(vendorId: string, from: Date, to: Date): Promise<AnalyticsSummary>;
    /** Дневной временной ряд выручки за период. */
    abstract revenueSeries(vendorId: string, from: Date, to: Date): Promise<AnalyticsBucket[]>;
    /** Воронка по статусам доставки саб-заказов. */
    abstract statusFunnel(vendorId: string): Promise<StatusFunnelItem[]>;
    /** Топ-товары вендора по продажам. */
    abstract topProducts(vendorId: string, limit: number): Promise<TopProductItem[]>;
    /** Платформенная сводка (GMV, выручка платформы = комиссии, заказы) за период. */
    abstract platformSummary(from: Date, to: Date): Promise<PlatformAnalyticsSummary>;
}
