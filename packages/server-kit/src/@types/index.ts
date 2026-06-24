import type { Request } from 'express';

/** Аутентифицированный пользователь (заполняется auth-guard в Stage 2). */
export type AuthUser = {
    id: string;
    role: string;
    permissions?: string[];
    vendorId?: string;
};

/** Контекст продавца для scoped-запросов. */
export type VendorContext = {
    id: string;
};

/** Express-Request, обогащённый контекстом запроса. */
export type RequestWithContext = Request & {
    traceId?: string;
    user?: AuthUser;
    vendor?: VendorContext;
};

export const TRACE_ID_HEADER = 'x-trace-id';
export const PERMISSIONS_KEY = 'permissions';
export const REQUEST_TIMEOUT_MS = Symbol('REQUEST_TIMEOUT_MS');
