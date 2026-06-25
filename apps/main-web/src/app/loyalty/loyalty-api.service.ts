import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '../catalog/models';
import type { LoyaltyProgram, LoyaltyStatus } from './models';

/**
 * Доступ к API лояльности. `me()` требует JWT (добавляется authInterceptor),
 * `program()` — публичный. База — из RUNTIME_CONFIG.apiBaseUrl.
 */
@Injectable({ providedIn: 'root' })
export class LoyaltyApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Текущий статус лояльности пользователя. */
    me(): Observable<LoyaltyStatus> {
        return this.http
            .get<ApiResponse<LoyaltyStatus>>(`${this.base}/loyalty/me`)
            .pipe(map((res) => res.data));
    }

    /** Публичная программа лояльности (уровни). */
    program(): Observable<LoyaltyProgram> {
        return this.http
            .get<ApiResponse<LoyaltyProgram>>(`${this.base}/loyalty/program`)
            .pipe(map((res) => res.data));
    }
}
