import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { RequestWithContext, VendorContext } from '../../@types';

/** Извлекает контекст продавца из запроса (или из vendorId пользователя). */
export const CurrentVendor = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): VendorContext | undefined => {
        const request = ctx.switchToHttp().getRequest<RequestWithContext>();
        if (request.vendor) {
            return request.vendor;
        }
        const vendorId = request.user?.vendorId;
        return vendorId ? { id: vendorId } : undefined;
    },
);
