import type { JwtPayload } from '../@types';

/**
 * Контракт верификации access-токена. Реализует feature `auth` (TokenService);
 * другие фичи (например chat WS-gateway) проверяют токен только через этот
 * контракт, не импортируя auth напрямую.
 */
export abstract class TokenVerifierContract {
    abstract verifyAccess(token: string): JwtPayload;
}
