import { UnauthorizedException } from '@brickam/core-kit';
import { type JwtPayload, Permission, Role } from '@brickam/domain-kit';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import type { TokenService } from '../token.service';
import { JwtAuthGuard } from './jwt-auth.guard';

type Req = { headers: Record<string, string>; user?: unknown };

function makeGuard(token: TokenService, isPublic: boolean): JwtAuthGuard {
    const reflector = new Reflector();
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);
    return new JwtAuthGuard(reflector, token);
}

const payload: JwtPayload = {
    sub: 'u1',
    role: Role.Buyer,
    permissions: [Permission.OrdersView],
};

function ctxFor(req: Req): ExecutionContext {
    return {
        switchToHttp: () => ({ getRequest: () => req }),
        getHandler: () => () => undefined,
        getClass: () => class {},
    } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
    it('@Public → true без проверки токена', () => {
        const token = { verifyAccess: vi.fn() } as unknown as TokenService;
        const guard = makeGuard(token, true);
        const req: Req = { headers: {} };
        expect(guard.canActivate(ctxFor(req))).toBe(true);
        expect(token.verifyAccess).not.toHaveBeenCalled();
    });

    it('нет токена → UnauthorizedException', () => {
        const token = { verifyAccess: vi.fn() } as unknown as TokenService;
        const guard = makeGuard(token, false);
        const req: Req = { headers: {} };
        expect(() => guard.canActivate(ctxFor(req))).toThrow(UnauthorizedException);
    });

    it('валидный токен → user в request', () => {
        const token = {
            verifyAccess: vi.fn().mockReturnValue(payload),
        } as unknown as TokenService;
        const guard = makeGuard(token, false);
        const req: Req = { headers: { authorization: 'Bearer good-token' } };
        expect(guard.canActivate(ctxFor(req))).toBe(true);
        expect(req.user).toEqual({
            id: 'u1',
            role: Role.Buyer,
            permissions: [Permission.OrdersView],
        });
        expect(token.verifyAccess).toHaveBeenCalledWith('good-token');
    });
});
