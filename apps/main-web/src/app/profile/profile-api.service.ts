import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ApiResponse } from '../catalog/models';
import type { ChangePasswordInput, Profile, UpdateProfileInput } from './models';

/**
 * Доступ к API профиля пользователя. Все эндпоинты требуют JWT (добавляется
 * authInterceptor). База — из RUNTIME_CONFIG.apiBaseUrl. Возвращает распакованную
 * `data` из конверта ответа. SSR-безопасно.
 */
@Injectable({ providedIn: 'root' })
export class ProfileApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Профиль текущего пользователя (имя/телефон/язык/тип аккаунта). */
    me(): Observable<Profile> {
        return this.http
            .get<ApiResponse<Profile>>(`${this.base}/users/me`)
            .pipe(map((res) => res.data));
    }

    /** Обновить профиль (имя/язык/тип аккаунта). */
    update(input: UpdateProfileInput): Observable<Profile> {
        return this.http
            .patch<ApiResponse<Profile>>(`${this.base}/users/me`, input)
            .pipe(map((res) => res.data));
    }

    /** Сменить пароль (с проверкой текущего). */
    changePassword(input: ChangePasswordInput): Observable<void> {
        return this.http
            .post<ApiResponse<unknown>>(`${this.base}/users/me/password`, input)
            .pipe(map(() => undefined));
    }
}
