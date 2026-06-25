import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStore } from './token.store';

/**
 * Всегда отправляет cookie (`withCredentials: true`) — в проде это передаёт
 * httpOnly-cookie `access_token`. Заголовок `Authorization: Bearer <token>`
 * добавляется только если токен есть в памяти (dev/Bearer-фолбэк).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = inject(TokenStore).get();
    return next(
        req.clone({
            withCredentials: true,
            ...(token ? { setHeaders: { Authorization: `Bearer ${token}` } } : {}),
        }),
    );
};
