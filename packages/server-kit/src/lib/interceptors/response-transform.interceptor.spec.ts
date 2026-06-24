import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { RequestContextInterceptor } from './request-context.interceptor';
import { ResponseTransformInterceptor } from './response-transform.interceptor';

const httpContext = (request: any = {}, response: any = {}, type = 'http') =>
    ({
        getType: () => type,
        switchToHttp: () => ({
            getRequest: () => request,
            getResponse: () => response,
        }),
    }) as unknown as ExecutionContext;

const handlerOf = (value: unknown): CallHandler => ({ handle: () => of(value) });

describe('ResponseTransformInterceptor', () => {
    const interceptor = new ResponseTransformInterceptor();

    it('оборачивает простое значение в {success,data}', async () => {
        const out = await firstValueFrom(interceptor.intercept(httpContext(), handlerOf({ x: 1 })));
        expect(out).toEqual({ success: true, data: { x: 1 } });
    });

    it('разворачивает страницу {data,meta} в конверт с meta', async () => {
        const page = { data: [1, 2], meta: { page: 1, total: 2 } };
        const out = await firstValueFrom(interceptor.intercept(httpContext(), handlerOf(page)));
        expect(out).toEqual({ success: true, data: [1, 2], meta: { page: 1, total: 2 } });
    });

    it('не оборачивает уже готовый конверт', async () => {
        const env = { success: true, data: 'ready' };
        const out = await firstValueFrom(interceptor.intercept(httpContext(), handlerOf(env)));
        expect(out).toBe(env);
    });

    it('пропускает не-http контекст без изменений', async () => {
        const out = await firstValueFrom(
            interceptor.intercept(httpContext({}, {}, 'rpc'), handlerOf('raw')),
        );
        expect(out).toBe('raw');
    });
});

describe('RequestContextInterceptor', () => {
    const interceptor = new RequestContextInterceptor();

    it('генерирует traceId и пишет его в заголовок ответа', async () => {
        const request: any = { headers: {} };
        const setHeader = vi.fn();
        const response: any = { setHeader };
        await firstValueFrom(
            interceptor.intercept(httpContext(request, response), handlerOf('ok')),
        );
        expect(request.traceId).toBeTruthy();
        expect(setHeader).toHaveBeenCalledWith('x-trace-id', request.traceId);
    });

    it('переиспользует входящий x-trace-id', async () => {
        const request: any = { headers: { 'x-trace-id': 'abc-123' } };
        const response: any = { setHeader: vi.fn() };
        await firstValueFrom(
            interceptor.intercept(httpContext(request, response), handlerOf('ok')),
        );
        expect(request.traceId).toBe('abc-123');
    });
});
