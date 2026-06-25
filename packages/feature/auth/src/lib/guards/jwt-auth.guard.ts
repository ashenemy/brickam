import { UnauthorizedException } from '@brickam/core-kit';
import type { RequestWithContext } from '@brickam/server-kit';
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TokenService } from '../token.service';

/**
 * Глобальный JWT-guard. Публичные маршруты (@Public) пропускаются,
 * остальным требуется валидный Bearer access-токен; payload кладётся в request.user.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly tokenService: TokenService,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<RequestWithContext>();
        const token = this.extractToken(request);
        if (!token) {
            throw new UnauthorizedException('errors.unauthorized');
        }

        const payload = this.tokenService.verifyAccess(token);

        request.user = {
            id: payload.sub,
            role: payload.role,
            permissions: payload.permissions,
            ...(payload.vendorId !== undefined ? { vendorId: payload.vendorId } : {}),
        };

        return true;
    }

    /**
     * Достаёт access-токен из httpOnly-cookie `access_token` (веб-клиенты) ИЛИ
     * из заголовка `Authorization: Bearer` (API/мобильные). Dual-mode.
     */
    private extractToken(request: RequestWithContext): string | null {
        const cookies = (request as { cookies?: Record<string, string> }).cookies;
        const fromCookie = cookies?.['access_token'];
        if (fromCookie) {
            return fromCookie;
        }
        const header = request.headers['authorization'];
        if (header?.startsWith('Bearer ')) {
            return header.slice('Bearer '.length).trim();
        }
        return null;
    }
}
