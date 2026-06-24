import type { ErrorDetails } from '../@types';
import { AppException } from './app-exception';
import { ErrorCode } from './error-code';

type Detail = ErrorDetails | undefined;

/** 422 — провал валидации (DTO/бизнес-инварианты). */
export class ValidationException extends AppException {
    constructor(messageKey = 'errors.validation', details?: Detail) {
        super({ code: ErrorCode.VALIDATION_FAILED, httpStatus: 422, messageKey, details });
    }
}

/** 400 — некорректный запрос. */
export class BadRequestException extends AppException {
    constructor(messageKey = 'errors.badRequest', details?: Detail) {
        super({ code: ErrorCode.BAD_REQUEST, httpStatus: 400, messageKey, details });
    }
}

/** 401 — не аутентифицирован. */
export class UnauthorizedException extends AppException {
    constructor(messageKey = 'errors.unauthorized', details?: Detail) {
        super({ code: ErrorCode.UNAUTHORIZED, httpStatus: 401, messageKey, details });
    }
}

/** 403 — недостаточно прав. */
export class ForbiddenException extends AppException {
    constructor(messageKey = 'errors.forbidden', details?: Detail) {
        super({ code: ErrorCode.FORBIDDEN, httpStatus: 403, messageKey, details });
    }
}

/** 404 — сущность не найдена. */
export class NotFoundException extends AppException {
    constructor(messageKey = 'errors.notFound', details?: Detail) {
        super({ code: ErrorCode.NOT_FOUND, httpStatus: 404, messageKey, details });
    }
}

/** 409 — конфликт состояния (дубликаты, гонки). */
export class ConflictException extends AppException {
    constructor(messageKey = 'errors.conflict', details?: Detail) {
        super({ code: ErrorCode.CONFLICT, httpStatus: 409, messageKey, details });
    }
}

/** 429 — превышен лимит запросов. */
export class RateLimitedException extends AppException {
    constructor(messageKey = 'errors.rateLimited', details?: Detail) {
        super({ code: ErrorCode.RATE_LIMITED, httpStatus: 429, messageKey, details });
    }
}

/** 500 — внутренняя ошибка (дефолт для непойманных). */
export class InternalException extends AppException {
    constructor(messageKey = 'errors.internal', details?: Detail) {
        super({ code: ErrorCode.INTERNAL, httpStatus: 500, messageKey, details });
    }
}

/** 503 — внешний сервис/провайдер недоступен. */
export class ServiceUnavailableException extends AppException {
    constructor(messageKey = 'errors.serviceUnavailable', details?: Detail) {
        super({ code: ErrorCode.SERVICE_UNAVAILABLE, httpStatus: 503, messageKey, details });
    }
}
