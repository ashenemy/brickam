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

/** Основа начисления уровней. */
export type LoyaltyBasis = 'spend' | 'orders' | string;

/** Тип скидки уровня. */
export type DiscountType = 'percent' | 'amount';

/** Уровень программы лояльности. */
export type LoyaltyTier = {
    level: number;
    name: string;
    threshold: number;
    discountType: DiscountType;
    discountValue: number;
};

/** Программа лояльности. */
export type LoyaltyProgram = {
    id: string;
    basis: LoyaltyBasis;
    tiers: LoyaltyTier[];
    active?: boolean;
};

/** Тело создания программы. */
export type CreateProgramPayload = {
    basis: LoyaltyBasis;
    tiers: LoyaltyTier[];
};

/**
 * API программ лояльности (роль admin). Список, создание, частичное обновление,
 * активация выбранной программы.
 */
@Injectable({ providedIn: 'root' })
export class LoyaltyApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Список программ. */
    list(): Observable<LoyaltyProgram[]> {
        return this.http
            .get<ApiResponse<LoyaltyProgram[]>>(`${this.base}/admin/loyalty/programs`)
            .pipe(map((res) => res.data));
    }

    /** Создать программу. */
    create(payload: CreateProgramPayload): Observable<LoyaltyProgram> {
        return this.http
            .post<ApiResponse<LoyaltyProgram>>(`${this.base}/admin/loyalty/programs`, payload)
            .pipe(map((res) => res.data));
    }

    /** Частичное обновление программы. */
    update(id: string, payload: Partial<CreateProgramPayload>): Observable<LoyaltyProgram> {
        return this.http
            .patch<ApiResponse<LoyaltyProgram>>(
                `${this.base}/admin/loyalty/programs/${encodeURIComponent(id)}`,
                payload,
            )
            .pipe(map((res) => res.data));
    }

    /** Активировать программу. */
    activate(id: string): Observable<LoyaltyProgram> {
        return this.http
            .post<ApiResponse<LoyaltyProgram>>(
                `${this.base}/admin/loyalty/programs/${encodeURIComponent(id)}/activate`,
                {},
            )
            .pipe(map((res) => res.data));
    }
}
