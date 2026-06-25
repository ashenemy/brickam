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
 * Листинг: GET /orders/vendor-orders (TODO: точный путь/фильтр уточнить —
 * в бэкенде отдельного листинг-эндпоинта пока нет; используем разумный путь).
 */
@Injectable({ providedIn: 'root' })
export class OrdersApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Список вендорских саб-заказов. */
    list(): Observable<VendorOrder[]> {
        // TODO: подтвердить путь листинга вендорских саб-заказов на бэкенде.
        return this.http
            .get<ApiResponse<VendorOrder[]>>(`${this.base}/orders/vendor-orders`)
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
