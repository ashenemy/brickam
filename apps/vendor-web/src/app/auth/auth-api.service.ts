import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Конверт ответа бэкенда: `{ success, data }`. */
type ApiResponse<T> = { success: boolean; data: T };

/** Пара JWT-токенов, выдаётся при логине/подтверждении OTP. */
export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};

/** Результат регистрации владельца: ожидается ввод OTP. */
export type RegisterResult = { otpSent: boolean };

/**
 * Доступ к API авторизации продавца (база = RUNTIME_CONFIG.apiBaseUrl).
 * register создаёт владельца + вендора в статусе pending (онбординг на бэке),
 * затем требуется подтверждение телефона кодом из SMS (verifyOtp).
 * login/verifyOtp возвращают пару токенов для кабинета.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Регистрация владельца вендора. Роль фиксирована: vendor_owner. */
    register(phone: string, password: string, name: string): Observable<RegisterResult> {
        return this.http
            .post<ApiResponse<RegisterResult>>(`${this.base}/auth/register`, {
                phone,
                password,
                name,
                role: 'vendor_owner',
            })
            .pipe(map((res) => res.data));
    }

    /** Подтверждение телефона кодом из SMS — возвращает токены. */
    verifyOtp(phone: string, code: string): Observable<{ tokens: AuthTokens }> {
        return this.http
            .post<ApiResponse<{ tokens: AuthTokens }>>(`${this.base}/auth/verify-otp`, {
                phone,
                code,
            })
            .pipe(map((res) => res.data));
    }

    /** Вход по телефону и паролю — возвращает токены. */
    login(phone: string, password: string): Observable<{ tokens: AuthTokens }> {
        return this.http
            .post<ApiResponse<{ tokens: AuthTokens }>>(`${this.base}/auth/login`, {
                phone,
                password,
            })
            .pipe(map((res) => res.data));
    }
}
