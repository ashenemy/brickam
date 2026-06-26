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

/** Конверт постраничного ответа API ({ success, data, meta }). */
type ApiListResponse<T> = {
    success: boolean;
    data: T[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
};

/** Статус доставки саб-заказа вендора (DeliveryStatus бэкенда). */
export type DeliveryStatus = 'accepted' | 'picked' | 'in_transit' | 'delivered' | 'cancelled';

/** Позиция саб-заказа вендора. */
export type VendorOrderItem = {
    productId: string;
    qty: number;
    unitPrice: number;
    discountApplied: number;
    lineTotal: number;
};

/** Саб-заказ вендора. */
export type VendorOrder = {
    id: string;
    orderId: string;
    vendorId: string;
    items: VendorOrderItem[];
    subtotal: number;
    commissionPercentSnapshot: number;
    commissionAmount: number;
    payoutAmount: number;
    deliveryStatus: DeliveryStatus;
};

/**
 * Доступ к API вендорских саб-заказов.
 * Смена статуса доставки: PATCH /orders/vendor-orders/:id/delivery {status,note?}.
 * Листинг: GET /orders/vendor-orders?page=&pageSize= (постраничный конверт {data,meta}).
 */
@Injectable({ providedIn: 'root' })
export class OrdersApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Список вендорских саб-заказов (одна страница; бэкенд пагинирует). */
    list(page = 1, pageSize = 50): Observable<VendorOrder[]> {
        const params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
        return this.http
            .get<ApiListResponse<VendorOrder>>(`${this.base}/orders/vendor-orders`, { params })
            .pipe(map((res) => res.data));
    }

    /** Меняет статус доставки саб-заказа. */
    updateDelivery(id: string, status: DeliveryStatus, note?: string): Observable<VendorOrder> {
        const body = note ? { status, note } : { status };
        return this.http
            .patch<ApiResponse<VendorOrder>>(
                `${this.base}/orders/vendor-orders/${encodeURIComponent(id)}/delivery`,
                body,
            )
            .pipe(map((res) => res.data));
    }
}
