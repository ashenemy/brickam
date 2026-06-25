import { inject } from '@angular/core';
import { type CanActivateFn, Router, type UrlTree } from '@angular/router';
import { TokenStore } from './token.store';

/**
 * Guard маршрута: пускает, только если есть JWT-токен, иначе редиректит на /login.
 * SSR-безопасно — на сервере токена нет, доступ к localStorage только через TokenStore.
 */
export const authGuard: CanActivateFn = (): boolean | UrlTree => {
    const token = inject(TokenStore).get();
    if (!token) {
        return inject(Router).parseUrl('/login');
    }
    return true;
};
