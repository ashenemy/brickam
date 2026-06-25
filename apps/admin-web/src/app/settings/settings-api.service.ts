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

/** Ключ платформенной настройки. */
export type SettingKey = 'default' | 'media' | 'seo';

/** Значение настройки 'default'. */
export type DefaultSettings = {
    commissionPercent?: number;
    aiPrompts?: {
        description?: string;
        image?: string;
        video?: string;
    };
};

/** Значение настройки 'media' (лимиты). */
export type MediaSettings = {
    maxImageSizeMb?: number;
    maxVideoSizeMb?: number;
    maxImagesPerProduct?: number;
};

/** Значение настройки 'seo'. */
export type SeoSettings = {
    botUserAgents?: string[];
};

/**
 * API платформенных настроек (роль admin). Универсальные GET/PUT по ключу;
 * значение — произвольный JSON-объект под конкретный ключ.
 */
@Injectable({ providedIn: 'root' })
export class SettingsApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Прочитать значение настройки по ключу. */
    get<T>(key: SettingKey): Observable<T> {
        return this.http
            .get<ApiResponse<{ value: T }>>(`${this.base}/admin/settings/${key}`)
            .pipe(map((res) => res.data.value));
    }

    /** Сохранить значение настройки по ключу. */
    put<T>(key: SettingKey, value: T): Observable<T> {
        return this.http
            .put<ApiResponse<{ value: T }>>(`${this.base}/admin/settings/${key}`, { value })
            .pipe(map((res) => res.data.value));
    }
}
