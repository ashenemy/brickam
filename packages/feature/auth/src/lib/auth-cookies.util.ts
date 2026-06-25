import type { AuthTokens } from '@brickam/domain-kit';
import type { Response } from 'express';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';
const ACCESS_MAX_AGE_MS = 15 * 60 * 1000; // ~15 минут
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // ~30 дней

/**
 * Ставит httpOnly-cookie с токенами (Foundations §17, защита от XSS-кражи).
 * `secure`+`sameSite:'none'` в проде (кросс-доменный фронт через https); в dev —
 * `lax` по http. Access/refresh — раздельные cookie с разным сроком и путём.
 */
export function setAuthCookies(res: Response, tokens: AuthTokens, isProduction: boolean): void {
    const base = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? ('none' as const) : ('lax' as const),
    };
    res.cookie(ACCESS_COOKIE, tokens.accessToken, {
        ...base,
        path: '/',
        maxAge: ACCESS_MAX_AGE_MS,
    });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
        ...base,
        path: '/api/auth/refresh',
        maxAge: REFRESH_MAX_AGE_MS,
    });
}

/** Удаляет cookie с токенами (logout). */
export function clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_COOKIE, { path: '/' });
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth/refresh' });
}
