import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser, RequestWithContext } from '../../@types';

/** Извлекает текущего пользователя (или его поле) из запроса. */
export const CurrentUser = createParamDecorator(
    (
        field: keyof AuthUser | undefined,
        ctx: ExecutionContext,
    ): AuthUser | AuthUser[keyof AuthUser] | undefined => {
        const request = ctx.switchToHttp().getRequest<RequestWithContext>();
        const user = request.user;
        if (!user) {
            return undefined;
        }
        return field ? user[field] : user;
    },
);
