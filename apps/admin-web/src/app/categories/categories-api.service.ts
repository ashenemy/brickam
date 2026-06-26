import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type ApiResponse<T> = { success: boolean; data: T };

/** Локализованное имя категории. */
export type LocalizedName = { hy: string; ru: string; en: string };

/** Категория каталога (админ-представление). */
export type AdminCategory = {
    id: string;
    slug: string;
    parentId?: string;
    name: LocalizedName;
    icon?: string;
    order: number;
    coverUrl?: string;
    featuredOnHome?: boolean;
};

/** Поля, доступные для правки админом. */
export type CategoryPatch = {
    featuredOnHome?: boolean;
    coverUrl?: string;
};

/**
 * Категории каталога для админки. Список — публичный GET; правка featured/обложки —
 * PATCH /catalog/categories/:id (требует admin-токена, добавляется интерсептором).
 */
@Injectable({ providedIn: 'root' })
export class CategoriesAdminApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    list(): Observable<AdminCategory[]> {
        return this.http
            .get<ApiResponse<AdminCategory[]>>(`${this.base}/catalog/categories`)
            .pipe(map((res) => res.data));
    }

    update(id: string, patch: CategoryPatch): Observable<AdminCategory> {
        return this.http
            .patch<ApiResponse<AdminCategory>>(`${this.base}/catalog/categories/${id}`, patch)
            .pipe(map((res) => res.data));
    }
}
