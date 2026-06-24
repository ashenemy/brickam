import { ForbiddenException } from '@brickam/core-kit';
import { PERMISSIONS_KEY, type RequestWithContext } from '@brickam/server-kit';
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Глобальный guard прав. Публичные маршруты пропускаются; для остальных
 * проверяет, что у пользователя есть все права, требуемые @Auth(...).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!required || required.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<RequestWithContext>();
        const granted = request.user?.permissions ?? [];
        const hasAll = required.every((perm) => granted.includes(perm));
        if (!hasAll) {
            throw new ForbiddenException('errors.forbidden');
        }

        return true;
    }
}
