import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '../catalog/models';
import type { AiSearchResult } from './models';

/**
 * Доступ к AI-поиску бэкенда. База берётся из RUNTIME_CONFIG.apiBaseUrl.
 * Публичный эндпоинт без токена; работает на сервере (SSR) и в браузере.
 */
@Injectable({ providedIn: 'root' })
export class AiSearchApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Поиск по свободному описанию проекта. */
    search(query: string): Observable<AiSearchResult> {
        return this.http
            .post<ApiResponse<AiSearchResult>>(`${this.base}/ai/search`, { query })
            .pipe(map((res) => res.data));
    }
}
