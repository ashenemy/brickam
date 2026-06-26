import { AppConfigService } from '@brickam/config-kit';
import { ForbiddenException } from '@brickam/core-kit';
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

/** Безопасные методы — состояние не меняют, CSRF неприменим. */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
/** Имя httpOnly-cookie с access-токеном (см. auth-cookies.util). */
const ACCESS_COOKIE = 'access_token';
/** Ключ метаданных публичного маршрута (совпадает с @Public). */
const IS_PUBLIC_KEY = 'isPublic';

/**
 * Защита от CSRF для cookie-аутентификации (Foundations §17). В проде cookie
 * ставятся с `SameSite=none` (кросс-доменный фронт на поддоменах), поэтому
 * мутирующие запросы дополнительно сверяются по заголовку Origin/Referer против
 * разрешённых `corsOrigins`.
 *
 * Применяется ТОЛЬКО когда: прод + мутирующий метод + запрос аутентифицирован
 * именно cookie (есть `access_token`). Bearer-запросы (мобайл/SSR/интеграции) и
 * @Public-маршруты (вебхуки/коллбэки PSP сервер-к-серверу) не подвержены CSRF и
 * пропускаются. В dev/тестах guard прозрачен.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
    constructor(
        private readonly config: AppConfigService,
        private readonly reflector: Reflector,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        if (!this.config.isProduction || context.getType() !== 'http') {
            return true;
        }
        const req = context.switchToHttp().getRequest<Request>();
        if (SAFE_METHODS.has(req.method)) {
            return true;
        }

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }

        // CSRF возможен только при cookie-аутентификации: без access-cookie запрос
        // авторизуется Bearer-токеном, который браузер кросс-сайтом не отправит.
        const cookies = (req as unknown as { cookies?: Record<string, string> }).cookies ?? {};
        if (!cookies[ACCESS_COOKIE]) {
            return true;
        }

        const origin = this.originOf(req);
        if (origin && this.config.server.corsOrigins.includes(origin)) {
            return true;
        }

        throw new ForbiddenException('errors.forbidden');
    }

    /** Источник запроса из Origin, либо из Referer (protocol+host), либо null. */
    private originOf(req: Request): string | null {
        const origin = req.headers.origin;
        if (typeof origin === 'string' && origin.length > 0) {
            return origin;
        }
        const referer = req.headers.referer;
        if (typeof referer === 'string' && referer.length > 0) {
            try {
                const url = new URL(referer);
                return `${url.protocol}//${url.host}`;
            } catch {
                return null;
            }
        }
        return null;
    }
}
