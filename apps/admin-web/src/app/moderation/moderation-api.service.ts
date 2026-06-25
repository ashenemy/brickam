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

/** Действие модерации. */
export type ModerationAction = 'approve' | 'reject';

/** Локализованный текст. */
export type LocalizedText = {
    hy: string;
    ru: string;
    en: string;
};

/** Вендор на модерации. */
export type ModerationVendor = {
    id: string;
    name: string;
    status: string;
    region?: string;
    createdAt?: string;
};

/** Товар на модерации. */
export type ModerationProduct = {
    id: string;
    slug: string;
    vendorId: string;
    title: LocalizedText;
    status: string;
    price?: number;
};

/**
 * API модерации (роль admin). Списки вендоров/товаров на модерации
 * и действия approve/reject через PATCH .../moderate.
 */
@Injectable({ providedIn: 'root' })
export class ModerationApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Вендоры по статусу (например pending). */
    listVendors(status: string): Observable<ModerationVendor[]> {
        const params = new HttpParams().set('status', status);
        return this.http
            .get<ApiResponse<ModerationVendor[]>>(`${this.base}/admin/vendors`, { params })
            .pipe(map((res) => res.data));
    }

    /** Товары на модерации по статусу. */
    listProducts(status: string): Observable<ModerationProduct[]> {
        const params = new HttpParams().set('status', status);
        return this.http
            .get<ApiResponse<ModerationProduct[]>>(`${this.base}/admin/products`, { params })
            .pipe(map((res) => res.data));
    }

    /** Модерация вендора. */
    moderateVendor(id: string, action: ModerationAction): Observable<ModerationVendor> {
        return this.http
            .patch<ApiResponse<ModerationVendor>>(
                `${this.base}/admin/vendors/${encodeURIComponent(id)}/moderate`,
                { action },
            )
            .pipe(map((res) => res.data));
    }

    /** Модерация товара. */
    moderateProduct(id: string, action: ModerationAction): Observable<ModerationProduct> {
        return this.http
            .patch<ApiResponse<ModerationProduct>>(
                `${this.base}/admin/products/${encodeURIComponent(id)}/moderate`,
                { action },
            )
            .pipe(map((res) => res.data));
    }
}
