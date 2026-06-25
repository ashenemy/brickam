import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiListResponse, ApiResponse } from '../catalog/models';
import type { CheckoutAddress, CheckoutResult, Order, OrderListResult } from './models';

/**
 * Доступ к API заказов. Все эндпоинты требуют JWT (добавляется authInterceptor).
 * База — из RUNTIME_CONFIG.apiBaseUrl.
 */
@Injectable({ providedIn: 'root' })
export class OrdersApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Оформить заказ из корзины по адресу доставки. */
    checkout(deliveryAddress: CheckoutAddress): Observable<CheckoutResult> {
        return this.http
            .post<ApiResponse<CheckoutResult>>(`${this.base}/orders/checkout`, {
                deliveryAddress,
            })
            .pipe(map((res) => res.data));
    }

    /** Подтвердить оплату заказа. */
    pay(orderId: string): Observable<Order> {
        return this.http
            .post<ApiResponse<Order>>(`${this.base}/orders/${encodeURIComponent(orderId)}/pay`, {})
            .pipe(map((res) => res.data));
    }

    /** Постраничный список заказов покупателя. */
    list(page = 1, pageSize = 10): Observable<OrderListResult> {
        const params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
        return this.http
            .get<ApiListResponse<Order>>(`${this.base}/orders`, { params })
            .pipe(map((res) => ({ data: res.data, meta: res.meta })));
    }

    /** Заказ по id. */
    getById(orderId: string): Observable<Order> {
        return this.http
            .get<ApiResponse<Order>>(`${this.base}/orders/${encodeURIComponent(orderId)}`)
            .pipe(map((res) => res.data));
    }
}
