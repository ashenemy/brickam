import type {
    AnalyticsBucket,
    AnalyticsSummary,
    StatusFunnelItem,
    TopProductItem,
} from '@brickam/domain-kit';

/**
 * Дашборд аналитики вендора (Foundations §14): сводка, временной ряд выручки,
 * воронка статусов доставки и топ-товары. Собирается из OrdersAnalyticsContract.
 */
export type AnalyticsDashboard = {
    summary: AnalyticsSummary;
    revenueSeries: AnalyticsBucket[];
    statusFunnel: StatusFunnelItem[];
    topProducts: TopProductItem[];
};
