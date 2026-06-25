import { inject } from '@angular/core';
import { type CanActivateFn, Router, type UrlTree } from '@angular/router';
import { TokenStore } from './token.store';

/**
 * Гард авторизации: пускает только при наличии токена,
 * иначе редиректит на /login. Ставится перед roleGuard на защищённых маршрутах.
 */
export const authGuard: CanActivateFn = (): boolean | UrlTree => {
    const token = inject(TokenStore).get();
    if (token) {
        return true;
    }
    return inject(Router).parseUrl('/login');
};
