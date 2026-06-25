import type { CallHandler, ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { firstValueFrom, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import type { IdempotencyService } from './idempotency.service';

const context = (request: any, type = 'http'): ExecutionContext => {
    const response = { statusCode: 201, status: vi.fn() };
    return {
        getType: () => type,
        getHandler: () => () => undefined,
        switchToHttp: () => ({
            getRequest: () => request,
            getResponse: () => response,
        }),
        __response: response,
    } as unknown as ExecutionContext;
};

const handlerOf = (value: unknown): CallHandler => ({ handle: vi.fn(() => of(value)) });

describe('IdempotencyInterceptor', () => {
    let reflector: { get: ReturnType<typeof vi.fn> };
    let service: {
        begin: ReturnType<typeof vi.fn>;
        complete: ReturnType<typeof vi.fn>;
        fail: ReturnType<typeof vi.fn>;
    };
    let interceptor: IdempotencyInterceptor;

    const req = (overrides: Record<string, unknown> = {}) => ({
        method: 'POST',
        path: '/x',
        headers: { 'idempotency-key': 'k1' },
        body: { n: 1 },
        user: { sub: 'u1' },
        ...overrides,
    });

    beforeEach(() => {
        reflector = { get: vi.fn(() => true) };
        service = {
            begin: vi.fn(),
            complete: vi.fn(() => Promise.resolve()),
            fail: vi.fn(() => Promise.resolve()),
        };
        interceptor = new IdempotencyInterceptor(
            reflector as unknown as Reflector,
            service as unknown as IdempotencyService,
        );
    });

    it('без метаданных → проброс next.handle (begin не зовётся)', async () => {
        reflector.get.mockReturnValue(undefined);
        const handler = handlerOf('ok');
        const out = await firstValueFrom(await interceptor.intercept(context(req()), handler));
        expect(out).toBe('ok');
        expect(handler.handle).toHaveBeenCalled();
        expect(service.begin).not.toHaveBeenCalled();
    });

    it('без заголовка → проброс next.handle', async () => {
        const handler = handlerOf('ok');
        const out = await firstValueFrom(
            await interceptor.intercept(context(req({ headers: {} })), handler),
        );
        expect(out).toBe('ok');
        expect(service.begin).not.toHaveBeenCalled();
    });

    it('не-http контекст → проброс', async () => {
        const handler = handlerOf('ok');
        const out = await firstValueFrom(
            await interceptor.intercept(context(req(), 'rpc'), handler),
        );
        expect(out).toBe('ok');
        expect(service.begin).not.toHaveBeenCalled();
    });

    it('begin→proceed → выполняет хендлер и зовёт complete', async () => {
        service.begin.mockResolvedValue({ proceed: true });
        const handler = handlerOf({ id: 'a' });
        const out = await firstValueFrom(await interceptor.intercept(context(req()), handler));
        expect(out).toEqual({ id: 'a' });
        expect(handler.handle).toHaveBeenCalled();
        expect(service.complete).toHaveBeenCalledWith('k1', 201, { id: 'a' });
    });

    it('begin→replay → возвращает сохранённый ответ без вызова next', async () => {
        service.begin.mockResolvedValue({ replay: { statusCode: 201, body: { id: 'saved' } } });
        const handler = handlerOf({ id: 'fresh' });
        const ctx = context(req());
        const out = await firstValueFrom(await interceptor.intercept(ctx, handler));
        expect(out).toEqual({ id: 'saved' });
        expect(handler.handle).not.toHaveBeenCalled();
        expect((ctx as any).__response.status).toHaveBeenCalledWith(201);
    });

    it('begin передаёт userId из user.sub', async () => {
        service.begin.mockResolvedValue({ proceed: true });
        await firstValueFrom(await interceptor.intercept(context(req()), handlerOf('ok')));
        expect(service.begin).toHaveBeenCalledWith('k1', 'u1', 'POST', '/x', { n: 1 });
    });

    it('begin использует user.id если sub нет', async () => {
        service.begin.mockResolvedValue({ proceed: true });
        await firstValueFrom(
            await interceptor.intercept(context(req({ user: { id: 'u2' } })), handlerOf('ok')),
        );
        expect(service.begin).toHaveBeenCalledWith('k1', 'u2', 'POST', '/x', { n: 1 });
    });

    it('ошибка хендлера → зовёт fail и пробрасывает ошибку', async () => {
        service.begin.mockResolvedValue({ proceed: true });
        const handler: CallHandler = { handle: () => throwError(() => new Error('boom')) };
        await expect(
            firstValueFrom(await interceptor.intercept(context(req()), handler)),
        ).rejects.toThrow('boom');
        expect(service.fail).toHaveBeenCalledWith('k1');
    });

    it('заголовок-массив → берёт первое значение', async () => {
        service.begin.mockResolvedValue({ proceed: true });
        await firstValueFrom(
            await interceptor.intercept(
                context(req({ headers: { 'idempotency-key': ['kA', 'kB'] } })),
                handlerOf('ok'),
            ),
        );
        expect(service.begin).toHaveBeenCalledWith('kA', 'u1', 'POST', '/x', { n: 1 });
    });
});
