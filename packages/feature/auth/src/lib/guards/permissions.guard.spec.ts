import { ForbiddenException } from '@brickam/core-kit';
import { Permission } from '@brickam/domain-kit';
import { PERMISSIONS_KEY } from '@brickam/server-kit';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { describe, expect, it, vi } from 'vitest';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PermissionsGuard } from './permissions.guard';

type Req = { user?: { permissions?: string[] } };

function ctxFor(req: Req): ExecutionContext {
    return {
        switchToHttp: () => ({ getRequest: () => req }),
        getHandler: () => () => undefined,
        getClass: () => class {},
    } as unknown as ExecutionContext;
}

/** Reflector, возвращающий метаданные по ключу. */
function makeGuard(meta: { isPublic?: boolean; required?: string[] }): PermissionsGuard {
    const reflector = new Reflector();
    vi.spyOn(reflector, 'getAllAndOverride').mockImplementation((key: string) => {
        if (key === IS_PUBLIC_KEY) return meta.isPublic ?? false;
        if (key === PERMISSIONS_KEY) return meta.required;
        return undefined;
    });
    return new PermissionsGuard(reflector);
}

describe('PermissionsGuard', () => {
    it('@Public → true', () => {
        const guard = makeGuard({ isPublic: true });
        expect(guard.canActivate(ctxFor({}))).toBe(true);
    });

    it('нет требуемых прав → true', () => {
        const guard = makeGuard({ required: [] });
        expect(guard.canActivate(ctxFor({ user: { permissions: [] } }))).toBe(true);
    });

    it('есть все права → true', () => {
        const guard = makeGuard({ required: [Permission.ProductsManage] });
        const req: Req = { user: { permissions: [Permission.ProductsManage] } };
        expect(guard.canActivate(ctxFor(req))).toBe(true);
    });

    it('недостаёт прав → ForbiddenException', () => {
        const guard = makeGuard({ required: [Permission.ProductsManage] });
        const req: Req = { user: { permissions: [Permission.OrdersView] } };
        expect(() => guard.canActivate(ctxFor(req))).toThrow(ForbiddenException);
    });

    it('нет user → ForbiddenException при требуемых правах', () => {
        const guard = makeGuard({ required: [Permission.ProductsManage] });
        expect(() => guard.canActivate(ctxFor({}))).toThrow(ForbiddenException);
    });
});
