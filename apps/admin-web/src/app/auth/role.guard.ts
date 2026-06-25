import { inject } from '@angular/core';
import { type CanActivateFn, Router, type UrlTree } from '@angular/router';
import { SessionStore } from './session.store';

/**
 * Guard маршрута по РЕАЛЬНОЙ роли пользователя из SessionStore (источник —
 * GET /auth/me, не статический provideRole).
 *
 * - не аутентифицирован → редирект на /login;
 * - роль входит в allowed → пропустить;
 * - роль НЕ входит в allowed → редирект на /forbidden.
 *
 * Если пользователь аутентифицирован, но роль ещё не загружена (role === null,
 * например профиль ещё грузится после перезагрузки) — пропускаем: бэкенд всё
 * равно защитит API, а маршрут перерисуется, когда роль подтянется.
 */
export function roleGuard(allowed: string[]): CanActivateFn {
    return (): boolean | UrlTree => {
        const session = inject(SessionStore);
        const router = inject(Router);

        if (!session.isAuthenticated()) {
            return router.parseUrl('/login');
        }

        const role = session.role();
        if (role === null) {
            return true;
        }

        return allowed.includes(role) ? true : router.parseUrl('/forbidden');
    };
}
