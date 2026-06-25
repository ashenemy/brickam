import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { TokenStore } from './token.store';

/**
 * Гейт аутентификации: без токена — редирект на /login, иначе пропуск.
 * SSR-безопасно (TokenStore на сервере отдаёт null → редирект на публичный /login).
 */
export const authGuard: CanActivateFn = () => {
    const token = inject(TokenStore).get();
    if (token) {
        return true;
    }
    return inject(Router).parseUrl('/login');
};
