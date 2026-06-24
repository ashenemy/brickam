import { ServiceUnavailableException } from '@brickam/core-kit';
import { type CallHandler, type ExecutionContext } from '@nestjs/common';
import { Expose } from 'class-transformer';
import { firstValueFrom, of, throwError, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { describe, expect, it } from 'vitest';
import { LoggingInterceptor } from './logging.interceptor';
import { SerializeInterceptor } from './serialize.interceptor';
import { TimeoutInterceptor } from './timeout.interceptor';

const httpContext = (request: any = {}, type = 'http') =>
    ({
        getType: () => type,
        switchToHttp: () => ({ getRequest: () => request, getResponse: () => ({}) }),
    }) as unknown as ExecutionContext;

const handlerOf = (value: unknown): CallHandler => ({ handle: () => of(value) });

class UserDto {
    @Expose() id!: string;
    @Expose() name!: string;
}

describe('TimeoutInterceptor', () => {
    it('пропускает быстрый ответ', async () => {
        const interceptor = new TimeoutInterceptor(1000);
        const out = await firstValueFrom(interceptor.intercept(httpContext(), handlerOf('ok')));
        expect(out).toBe('ok');
    });

    it('бросает ServiceUnavailable по таймауту', async () => {
        const interceptor = new TimeoutInterceptor(10);
        const slow: CallHandler = { handle: () => timer(100).pipe(map(() => 'late')) };
        await expect(
            firstValueFrom(interceptor.intercept(httpContext(), slow)),
        ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('пробрасывает прочие ошибки как есть', async () => {
        const interceptor = new TimeoutInterceptor(1000);
        const boom: CallHandler = { handle: () => throwError(() => new Error('boom')) };
        await expect(firstValueFrom(interceptor.intercept(httpContext(), boom))).rejects.toThrow(
            'boom',
        );
    });
});

describe('SerializeInterceptor', () => {
    it('преобразует ответ в экземпляр DTO', async () => {
        const interceptor = new SerializeInterceptor(UserDto);
        const out: any = await firstValueFrom(
            interceptor.intercept(httpContext(), handlerOf({ id: '1', name: 'A' })),
        );
        expect(out).toBeInstanceOf(UserDto);
        expect(out.name).toBe('A');
    });

    it('не трогает null/undefined', async () => {
        const interceptor = new SerializeInterceptor(UserDto);
        expect(
            await firstValueFrom(interceptor.intercept(httpContext(), handlerOf(null))),
        ).toBeNull();
    });
});

describe('LoggingInterceptor', () => {
    it('пропускает значение через', async () => {
        const interceptor = new LoggingInterceptor();
        const out = await firstValueFrom(
            interceptor.intercept(
                httpContext({ method: 'GET', url: '/x', traceId: 't' }),
                handlerOf(7),
            ),
        );
        expect(out).toBe(7);
    });

    it('не вмешивается в не-http контекст', async () => {
        const interceptor = new LoggingInterceptor();
        const out = await firstValueFrom(
            interceptor.intercept(httpContext({}, 'rpc'), handlerOf(1)),
        );
        expect(out).toBe(1);
    });
});
