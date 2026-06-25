import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse, CmsPage, CmsPageListItem } from './models';

/**
 * Доступ к CMS-страницам бэкенда. База берётся из RUNTIME_CONFIG.apiBaseUrl.
 * Работает и на сервере (SSR) и в браузере через provideHttpClient(withFetch()).
 */
@Injectable({ providedIn: 'root' })
export class PagesApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Опубликованная страница по slug. */
    getBySlug(slug: string): Observable<CmsPage> {
        return this.http
            .get<ApiResponse<CmsPage>>(`${this.base}/pages/${encodeURIComponent(slug)}`)
            .pipe(map((res) => res.data));
    }

    /** Список опубликованных страниц. */
    list(): Observable<CmsPageListItem[]> {
        return this.http
            .get<ApiResponse<CmsPageListItem[]>>(`${this.base}/pages`)
            .pipe(map((res) => res.data));
    }
}
