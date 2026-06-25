import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '../catalog/models';
import type { Cart } from './models';

/**
 * Доступ к API корзины. Все эндпоинты требуют JWT (добавляется authInterceptor).
 * База — из RUNTIME_CONFIG.apiBaseUrl. Каждый метод возвращает обновлённую корзину.
 */
@Injectable({ providedIn: 'root' })
export class CartApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Текущая корзина покупателя. */
    get(): Observable<Cart> {
        return this.http.get<ApiResponse<Cart>>(`${this.base}/cart`).pipe(map((res) => res.data));
    }

    /** Добавить товар (qty по умолчанию 1). */
    addItem(productId: string, qty = 1): Observable<Cart> {
        return this.http
            .post<ApiResponse<Cart>>(`${this.base}/cart/items`, { productId, qty })
            .pipe(map((res) => res.data));
    }

    /** Установить количество позиции. */
    updateQty(productId: string, qty: number): Observable<Cart> {
        return this.http
            .patch<ApiResponse<Cart>>(`${this.base}/cart/items/${encodeURIComponent(productId)}`, {
                qty,
            })
            .pipe(map((res) => res.data));
    }

    /** Удалить позицию из корзины. */
    removeItem(productId: string): Observable<Cart> {
        return this.http
            .delete<ApiResponse<Cart>>(`${this.base}/cart/items/${encodeURIComponent(productId)}`)
            .pipe(map((res) => res.data));
    }

    /** Очистить корзину. */
    clear(): Observable<Cart> {
        return this.http
            .delete<ApiResponse<Cart>>(`${this.base}/cart`)
            .pipe(map((res) => res.data));
    }
}
