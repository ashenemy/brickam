import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStore } from './token.store';

/**
 * Добавляет заголовок `Authorization: Bearer <token>`, если токен есть.
 * Без токена запрос проходит как есть (публичные эндпоинты / SSR без токена).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = inject(TokenStore).get();
    if (!token) {
        return next(req);
    }
    return next(
        req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
        }),
    );
};
