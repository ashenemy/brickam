import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type {
    ApiResponse,
    CreateProductPayload,
    ProductDetail,
    ProductListItem,
    UpdateProductPayload,
} from './models';

/**
 * Доступ к API товаров каталога для кабинета продавца.
 * Листинг: GET /catalog/products?vendorId=… (пагинированный конверт
 * `{success,data:items[],meta}` — берём `data`). Создание/обновление/удаление
 * требуют право products.manage (JWT добавляет authInterceptor).
 */
@Injectable({ providedIn: 'root' })
export class ProductsApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Список товаров вендора (по vendorId). Возвращает массив элементов листинга. */
    list(vendorId: string): Observable<ProductListItem[]> {
        const params = new HttpParams().set('vendorId', vendorId).set('pageSize', '100');
        return this.http
            .get<ApiResponse<ProductListItem[]>>(`${this.base}/catalog/products`, { params })
            .pipe(map((res) => res.data));
    }

    /** Создаёт товар. */
    create(payload: CreateProductPayload): Observable<ProductDetail> {
        return this.http
            .post<ApiResponse<ProductDetail>>(`${this.base}/catalog/products`, payload)
            .pipe(map((res) => res.data));
    }

    /** Обновляет товар по id (PATCH, частичное). */
    update(id: string, payload: UpdateProductPayload): Observable<ProductDetail> {
        return this.http
            .patch<ApiResponse<ProductDetail>>(
                `${this.base}/catalog/products/${encodeURIComponent(id)}`,
                payload,
            )
            .pipe(map((res) => res.data));
    }

    /** Скрывает товар (status=hidden) через PATCH. */
    hide(id: string): Observable<ProductDetail> {
        return this.update(id, { status: 'hidden' });
    }

    /** Показывает товар (status=active) через PATCH. */
    show(id: string): Observable<ProductDetail> {
        return this.update(id, { status: 'active' });
    }

    /** Удаляет товар по id. */
    remove(id: string): Observable<{ id: string }> {
        return this.http
            .delete<ApiResponse<{ id: string }>>(
                `${this.base}/catalog/products/${encodeURIComponent(id)}`,
            )
            .pipe(map((res) => res.data));
    }
}
