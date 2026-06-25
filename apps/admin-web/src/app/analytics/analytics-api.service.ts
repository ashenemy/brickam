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

/** Сводка платформенной аналитики. */
export type PlatformAnalytics = {
    gmv: number;
    platformRevenue: number;
    orders: number;
};

/**
 * API платформенной аналитики (роль admin).
 * TODO: если контроллера GET /admin/analytics ещё нет на бэке —
 * страница работает на моках; путь/конверт выбраны по образцу ТЗ.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Сводка за период [from, to] (ISO-даты). */
    summary(from: string, to: string): Observable<PlatformAnalytics> {
        const params = new HttpParams().set('from', from).set('to', to);
        return this.http
            .get<ApiResponse<PlatformAnalytics>>(`${this.base}/admin/analytics`, { params })
            .pipe(map((res) => res.data));
    }
}
