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

/** Профиль вендора (GET /vendors/me). */
export type Vendor = {
    id: string;
    slug: string;
    name: string;
    display?: string;
    ownerUserId: string;
    region: string;
    city?: string;
    status: 'active' | 'suspended';
    ratingAvg: number;
    ratingCount: number;
    logo?: string;
};

/** Частичное обновление профиля. */
export type UpdateVendorPayload = {
    name?: string;
    display?: string;
    region?: string;
    city?: string;
    logo?: string;
};

/**
 * Доступ к API профиля вендора. `me()` используется как источник vendorId
 * для остальных разделов (товары, аналитика, заказы) и на странице профиля.
 */
@Injectable({ providedIn: 'root' })
export class VendorsApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Профиль своего вендора. */
    me(): Observable<Vendor> {
        return this.http
            .get<ApiResponse<Vendor>>(`${this.base}/vendors/me`)
            .pipe(map((res) => res.data));
    }

    /** Обновляет профиль своего вендора. */
    update(payload: UpdateVendorPayload): Observable<Vendor> {
        return this.http
            .patch<ApiResponse<Vendor>>(`${this.base}/vendors/me`, payload)
            .pipe(map((res) => res.data));
    }
}
