import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Конверт ответа API. */
type ApiResponse<T> = {
    success: boolean;
    data: T;
};

/** Сводка (карточки). */
export type AnalyticsSummary = {
    gmv: number;
    orders: number;
    avgCheck: number;
};

/** Точка временного ряда выручки. */
export type AnalyticsBucket = {
    date: string;
    gmv: number;
    orders: number;
};

/** Элемент воронки статусов. */
export type StatusFunnelItem = {
    status: string;
    count: number;
};

/** Топ-товар. */
export type TopProductItem = {
    productId: string;
    qty: number;
    revenue: number;
};

/** Дашборд аналитики вендора. */
export type AnalyticsDashboard = {
    summary: AnalyticsSummary;
    revenueSeries: AnalyticsBucket[];
    statusFunnel: StatusFunnelItem[];
    topProducts: TopProductItem[];
};

/**
 * Доступ к API аналитики вендора.
 * TODO: на бэкенде контроллер analytics ещё не реализован (модуль-плейсхолдер);
 * пути выбраны по образцу ТЗ — GET /analytics/dashboard?from=&to= и export.csv/.xlsx.
 * Экспорт — прямые ссылки (открывать в новой вкладке / blob).
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Дашборд за период [from, to] (даты YYYY-MM-DD). */
    dashboard(from: string, to: string): Observable<AnalyticsDashboard> {
        const params = new HttpParams().set('from', from).set('to', to);
        return this.http
            .get<ApiResponse<AnalyticsDashboard>>(`${this.base}/analytics/dashboard`, { params })
            .pipe(map((res) => res.data));
    }

    /** Прямая ссылка на экспорт CSV за период. */
    csvUrl(from: string, to: string): string {
        return `${this.base}/analytics/export.csv?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    }

    /** Прямая ссылка на экспорт XLSX за период. */
    xlsxUrl(from: string, to: string): string {
        return `${this.base}/analytics/export.xlsx?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    }
}
