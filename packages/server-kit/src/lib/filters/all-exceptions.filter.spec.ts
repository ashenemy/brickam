import {
    ConflictException as AppConflict,
    NotFoundException as AppNotFound,
} from '@brickam/core-kit';
import { I18nService } from '@brickam/i18n-kit';
import { type ArgumentsHost, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AllExceptionsFilter } from './all-exceptions.filter';

const makeHost = (request: any = {}) => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const response = { status };
    const host = {
        switchToHttp: () => ({
            getRequest: () => request,
            getResponse: () => response,
        }),
    } as unknown as ArgumentsHost;
    return { host, status, json };
};

describe('AllExceptionsFilter', () => {
    let filter: AllExceptionsFilter;

    beforeEach(() => {
        filter = new AllExceptionsFilter(new I18nService());
    });

    it('маппит AppException в конверт с кодом, статусом и traceId', () => {
        const { host, status, json } = makeHost({ traceId: 't-1', headers: {} });
        filter.catch(new AppNotFound(), host);
        expect(status).toHaveBeenCalledWith(404);
        expect(json).toHaveBeenCalledWith({
            success: false,
            error: { code: 'NOT_FOUND', message: expect.any(String), traceId: 't-1' },
        });
    });

    it('локализует сообщение по Accept-Language', () => {
        const { host, json } = makeHost({ headers: { 'accept-language': 'ru' } });
        filter.catch(new AppConflict(), host);
        expect(json.mock.calls[0][0].error.message).toBe('Конфликт');
    });

    it('маппит Nest HttpException и достаёт детали валидации', () => {
        const { host, status, json } = makeHost({ headers: {} });
        filter.catch(new BadRequestException(['phone обязателен']), host);
        expect(status).toHaveBeenCalledWith(400);
        const body = json.mock.calls[0][0];
        expect(body.error.code).toBe('BAD_REQUEST');
        expect(body.error.details).toEqual(['phone обязателен']);
    });

    it('неизвестная ошибка → 500 INTERNAL', () => {
        const { host, status, json } = makeHost({ headers: {} });
        filter.catch(new Error('boom'), host);
        expect(status).toHaveBeenCalledWith(500);
        expect(json.mock.calls[0][0].error.code).toBe('INTERNAL');
    });

    it('работает без I18nService (фолбэк на messageKey)', () => {
        const noI18n = new AllExceptionsFilter();
        const { host, json } = makeHost({ headers: {} });
        noI18n.catch(new HttpException('x', HttpStatus.FORBIDDEN), host);
        expect(json.mock.calls[0][0].error.code).toBe('FORBIDDEN');
        expect(json.mock.calls[0][0].error.message).toBe('errors.forbidden');
    });
});
