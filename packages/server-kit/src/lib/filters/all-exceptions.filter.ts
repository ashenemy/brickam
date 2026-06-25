import { AppException, ErrorCode, type ErrorDetails, type ErrorEnvelope } from '@brickam/core-kit';
import { I18nService } from '@brickam/i18n-kit';
import {
    type ArgumentsHost,
    Catch,
    type ExceptionFilter,
    HttpException,
    Injectable,
    Logger,
    Optional,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import type { RequestWithContext } from '../../@types';

const STATUS_TO_CODE: Record<number, ErrorCode> = {
    400: ErrorCode.BAD_REQUEST,
    401: ErrorCode.UNAUTHORIZED,
    403: ErrorCode.FORBIDDEN,
    404: ErrorCode.NOT_FOUND,
    409: ErrorCode.CONFLICT,
    422: ErrorCode.VALIDATION_FAILED,
    429: ErrorCode.RATE_LIMITED,
    503: ErrorCode.SERVICE_UNAVAILABLE,
};

const STATUS_TO_KEY: Record<number, string> = {
    400: 'errors.badRequest',
    401: 'errors.unauthorized',
    403: 'errors.forbidden',
    404: 'errors.notFound',
    409: 'errors.conflict',
    422: 'errors.validation',
    429: 'errors.rateLimited',
    503: 'errors.serviceUnavailable',
};

type Resolved = {
    status: number;
    code: string;
    messageKey: string;
    details?: ErrorDetails;
};

/**
 * Глобальный фильтр: конвертирует любое исключение в унифицированный конверт
 * {success:false, error:{code,message,details?,traceId}} и локализует сообщение.
 */
@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger('Exceptions');

    constructor(@Optional() private readonly i18n?: I18nService) {}

    catch(exception: unknown, host: ArgumentsHost): void {
        const http = host.switchToHttp();
        const request = http.getRequest<RequestWithContext>();
        const response = http.getResponse();
        const traceId = request?.traceId;
        const lang = this.i18n?.resolveLang(request?.headers?.['accept-language'] ?? null) ?? 'hy';

        const resolved = this.resolve(exception);
        const message = this.i18n
            ? this.i18n.translate(resolved.messageKey, lang)
            : resolved.messageKey;

        if (resolved.status >= 500) {
            this.logger.error(
                `${resolved.code} trace=${traceId ?? '-'}`,
                exception instanceof Error ? exception.stack : String(exception),
            );
            // Отправка в Sentry (no-op, если Sentry.init не вызван — напр. в dev/тестах
            // без SENTRY_DSN). traceId связывает событие с логами/ответом.
            Sentry.captureException(exception, {
                tags: { traceId: traceId ?? 'none', code: resolved.code },
            });
        }

        const error: ErrorEnvelope['error'] = {
            code: resolved.code,
            message,
            ...(resolved.details !== undefined ? { details: resolved.details } : {}),
            ...(traceId ? { traceId } : {}),
        };
        response.status(resolved.status).json({ success: false, error } satisfies ErrorEnvelope);
    }

    private resolve(exception: unknown): Resolved {
        if (exception instanceof AppException) {
            return {
                status: exception.httpStatus,
                code: exception.code,
                messageKey: exception.messageKey,
                ...(exception.details !== undefined ? { details: exception.details } : {}),
            };
        }
        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const payload = exception.getResponse();
            const details = this.extractHttpDetails(payload);
            return {
                status,
                code: STATUS_TO_CODE[status] ?? ErrorCode.INTERNAL,
                messageKey: STATUS_TO_KEY[status] ?? 'errors.internal',
                ...(details !== undefined ? { details } : {}),
            };
        }
        return { status: 500, code: ErrorCode.INTERNAL, messageKey: 'errors.internal' };
    }

    /** Достаёт сообщения валидации из ответа Nest HttpException. */
    private extractHttpDetails(payload: unknown): ErrorDetails | undefined {
        if (payload && typeof payload === 'object' && 'message' in payload) {
            const message = (payload as { message: unknown }).message;
            if (Array.isArray(message)) {
                return message as unknown[];
            }
        }
        return undefined;
    }
}
