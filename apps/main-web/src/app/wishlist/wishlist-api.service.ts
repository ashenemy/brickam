import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '../catalog/models';
import type { WishlistData } from './models';

/**
 * Доступ к API вишлиста. Все эндпоинты требуют JWT (добавляется authInterceptor).
 * База — из RUNTIME_CONFIG.apiBaseUrl.
 */
@Injectable({ providedIn: 'root' })
export class WishlistApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Текущий вишлист пользователя. */
    get(): Observable<WishlistData> {
        return this.http
            .get<ApiResponse<WishlistData>>(`${this.base}/wishlist`)
            .pipe(map((res) => res.data));
    }

    /** Добавить товар (идемпотентно). */
    add(productId: string): Observable<WishlistData> {
        return this.http
            .post<ApiResponse<WishlistData>>(`${this.base}/wishlist/items`, { productId })
            .pipe(map((res) => res.data));
    }

    /** Удалить товар из вишлиста. */
    remove(productId: string): Observable<WishlistData> {
        return this.http
            .delete<ApiResponse<WishlistData>>(
                `${this.base}/wishlist/items/${encodeURIComponent(productId)}`,
            )
            .pipe(map((res) => res.data));
    }
}
