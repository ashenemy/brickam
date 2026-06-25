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

/** Пара JWT-токенов. */
export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};

/** Данные ответа логина. */
export type LoginData = {
    tokens: AuthTokens;
};

/**
 * API аутентификации админки. Только вход — регистрации нет
 * (админ создаётся сидом/другим админом).
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Вход по телефону и паролю → возвращает данные с токенами. */
    login(phone: string, password: string): Observable<LoginData> {
        return this.http
            .post<ApiResponse<LoginData>>(`${this.base}/auth/login`, { phone, password })
            .pipe(map((res) => res.data));
    }

    /** Выход — сервер очищает httpOnly-cookie. withCredentials шлёт cookie. */
    logout(): Observable<void> {
        return this.http
            .post<ApiResponse<unknown>>(`${this.base}/auth/logout`, {}, { withCredentials: true })
            .pipe(map(() => undefined));
    }
}
