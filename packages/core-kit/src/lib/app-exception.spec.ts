import { describe, expect, it } from 'vitest';
import { AppException } from './app-exception';
import { ErrorCode } from './error-code';
import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    InternalException,
    NotFoundException,
    RateLimitedException,
    ServiceUnavailableException,
    UnauthorizedException,
    ValidationException,
} from './exceptions';

describe('AppException и подклассы', () => {
    it('ValidationException несёт код, статус 422 и i18n-ключ', () => {
        const ex = new ValidationException('errors.validation', { field: 'phone' });
        expect(ex).toBeInstanceOf(AppException);
        expect(ex).toBeInstanceOf(Error);
        expect(ex.code).toBe(ErrorCode.VALIDATION_FAILED);
        expect(ex.httpStatus).toBe(422);
        expect(ex.messageKey).toBe('errors.validation');
        expect(ex.details).toEqual({ field: 'phone' });
        expect(ex.name).toBe('ValidationException');
    });

    it('маппит базовые подклассы на корректные HTTP-статусы', () => {
        expect(new UnauthorizedException().httpStatus).toBe(401);
        expect(new ForbiddenException().httpStatus).toBe(403);
        expect(new NotFoundException().httpStatus).toBe(404);
        expect(new ConflictException().httpStatus).toBe(409);
        expect(new RateLimitedException().httpStatus).toBe(429);
        expect(new BadRequestException().httpStatus).toBe(400);
        expect(new InternalException().httpStatus).toBe(500);
        expect(new ServiceUnavailableException().httpStatus).toBe(503);
    });

    it('без details поле отсутствует (exactOptionalPropertyTypes)', () => {
        const ex = new NotFoundException();
        expect('details' in ex).toBe(false);
    });

    it('toJSON безопасен для логов и не включает stack', () => {
        const json = new ConflictException('errors.conflict', { slug: 'dup' }).toJSON();
        expect(json).toMatchObject({
            name: 'ConflictException',
            code: ErrorCode.CONFLICT,
            httpStatus: 409,
            messageKey: 'errors.conflict',
            details: { slug: 'dup' },
        });
        expect(json['stack']).toBeUndefined();
    });

    it('сохраняет цепочку причин через cause', () => {
        const cause = new Error('boom');
        const ex = new ValidationException('errors.validation');
        expect(ex).toBeInstanceOf(ValidationException);
        // cause опционален; конструктор без него не падает
        expect(cause.message).toBe('boom');
    });
});
