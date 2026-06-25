import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RUNTIME_CONFIG } from '@brickam/config-kit/browser';
import { map, type Observable } from 'rxjs';
import type { ApiResponse } from '../catalog/models';
import type { AuthResult, RegisterResult } from './models';

/**
 * Доступ к публичным auth-эндпоинтам бэкенда. База — RUNTIME_CONFIG.apiBaseUrl.
 * Возвращает распакованную `data` из конверта ответа. SSR-безопасно
 * (provideHttpClient(withFetch())).
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
    private readonly http = inject(HttpClient);
    private readonly config = inject(RUNTIME_CONFIG);

    private get base(): string {
        return this.config.apiBaseUrl.replace(/\/$/, '');
    }

    /** Регистрация покупателя — отправляет OTP на телефон. */
    register(phone: string, password: string, name: string): Observable<RegisterResult> {
        return this.http
            .post<ApiResponse<RegisterResult>>(`${this.base}/auth/register`, {
                phone,
                password,
                name,
                role: 'buyer',
            })
            .pipe(map((res) => res.data));
    }

    /** Подтверждение телефона кодом из SMS — возвращает токены. */
    verifyOtp(phone: string, code: string): Observable<AuthResult> {
        return this.http
            .post<ApiResponse<AuthResult>>(`${this.base}/auth/verify-otp`, { phone, code })
            .pipe(map((res) => res.data));
    }

    /** Вход по телефону и паролю — возвращает токены. */
    login(phone: string, password: string): Observable<AuthResult> {
        return this.http
            .post<ApiResponse<AuthResult>>(`${this.base}/auth/login`, { phone, password })
            .pipe(map((res) => res.data));
    }
}
