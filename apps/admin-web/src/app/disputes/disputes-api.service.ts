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

/** Статус спора. */
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | string;

/** Спор. */
export type Dispute = {
    id: string;
    orderId?: string;
    buyerId?: string;
    vendorId?: string;
    reason?: string;
    status: DisputeStatus;
    resolution?: string;
    createdAt?: string;
};

/**
 * API споров (роль admin). Список, карточка, перевод в review,
 * разрешение с текстом resolution.
 */
@Injectable({ providedIn: 'root' })
export class DisputesApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Список споров. */
    list(): Observable<Dispute[]> {
        return this.http
            .get<ApiResponse<Dispute[]>>(`${this.base}/disputes`)
            .pipe(map((res) => res.data));
    }

    /** Карточка спора. */
    get(id: string): Observable<Dispute> {
        return this.http
            .get<ApiResponse<Dispute>>(`${this.base}/disputes/${encodeURIComponent(id)}`)
            .pipe(map((res) => res.data));
    }

    /** Перевести спор в рассмотрение. */
    review(id: string): Observable<Dispute> {
        return this.http
            .patch<ApiResponse<Dispute>>(
                `${this.base}/disputes/${encodeURIComponent(id)}/review`,
                {},
            )
            .pipe(map((res) => res.data));
    }

    /** Разрешить спор с текстом решения. */
    resolve(id: string, resolution: string): Observable<Dispute> {
        return this.http
            .patch<ApiResponse<Dispute>>(
                `${this.base}/disputes/${encodeURIComponent(id)}/resolve`,
                { resolution },
            )
            .pipe(map((res) => res.data));
    }
}
