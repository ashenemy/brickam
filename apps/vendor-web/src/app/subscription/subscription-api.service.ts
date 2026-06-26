import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Конверт ответа API. */
type ApiResponse<T> = {
    success: boolean;
    data: T;
};

/** Тариф подписки вендора. */
export type SubscriptionPlan = 'free' | 'pro';

/** Подписка вендора. */
export type Subscription = {
    id: string;
    vendorId: string;
    plan: SubscriptionPlan;
};

/**
 * Доступ к API подписки вендора: GET /subscription и PUT /subscription {plan}.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Текущая подписка. */
    get(): Observable<Subscription> {
        return this.http
            .get<ApiResponse<Subscription>>(`${this.base}/subscription`)
            .pipe(map((res) => res.data));
    }

    /** Меняет тариф подписки. */
    setPlan(plan: SubscriptionPlan): Observable<Subscription> {
        return this.http
            .put<ApiResponse<Subscription>>(`${this.base}/subscription`, { plan })
            .pipe(map((res) => res.data));
    }
}
