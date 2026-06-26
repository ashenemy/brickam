import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import { type Observable, of } from 'rxjs';
import { map, timeout } from 'rxjs/operators';

/** Таймаут запросов каталога — страховка, чтобы SSR не зависал на медленном API. */
const REQUEST_TIMEOUT_MS = 8000;

import type {
    ApiListResponse,
    ApiResponse,
    Category,
    ProductDetail,
    ProductFilters,
    ProductListResult,
} from './models';

/**
 * Доступ к каталожному API бэкенда. База берётся из RUNTIME_CONFIG.apiBaseUrl.
 * Работает и на сервере (SSR) и в браузере через provideHttpClient(withFetch()).
 */
@Injectable({ providedIn: 'root' })
export class CatalogApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Список категорий каталога. */
    getCategories(): Observable<Category[]> {
        return this.http.get<ApiResponse<Category[]>>(`${this.base}/catalog/categories`).pipe(
            timeout(REQUEST_TIMEOUT_MS),
            map((res) => res.data),
        );
    }

    /** Список товаров с серверной фильтрацией и пагинацией. */
    getProducts(filters: ProductFilters = {}): Observable<ProductListResult> {
        let params = new HttpParams();
        const set = (key: string, value: string | number | boolean | undefined): void => {
            if (value !== undefined && value !== null && value !== '') {
                params = params.set(key, String(value));
            }
        };
        set('page', filters.page);
        set('pageSize', filters.pageSize);
        set('q', filters.q);
        set('categoryId', filters.categoryId);
        set('vendorId', filters.vendorId);
        set('minPrice', filters.minPrice);
        set('maxPrice', filters.maxPrice);
        set('minRating', filters.minRating);
        set('inStock', filters.inStock);
        set('region', filters.region);
        set('sort', filters.sort);

        return this.http
            .get<ApiListResponse<ProductListResult['data'][number]>>(
                `${this.base}/catalog/products`,
                {
                    params,
                },
            )
            .pipe(
                timeout(REQUEST_TIMEOUT_MS),
                map((res) => ({ data: res.data, meta: res.meta })),
            );
    }

    /** Товары по списку id (публичный эндпоинт). Сохраняет порядок ответа бэкенда. */
    getProductsByIds(ids: string[]): Observable<ProductListResult['data']> {
        if (ids.length === 0) {
            return of([]);
        }
        const params = new HttpParams().set('ids', ids.join(','));
        return this.http
            .get<ApiResponse<ProductListResult['data']>>(`${this.base}/catalog/products/by-ids`, {
                params,
            })
            .pipe(
                timeout(REQUEST_TIMEOUT_MS),
                map((res) => res.data),
            );
    }

    /** Детальная карточка товара по slug. */
    getProduct(slug: string): Observable<ProductDetail> {
        return this.http
            .get<ApiResponse<ProductDetail>>(
                `${this.base}/catalog/products/${encodeURIComponent(slug)}`,
            )
            .pipe(
                timeout(REQUEST_TIMEOUT_MS),
                map((res) => res.data),
            );
    }
}
