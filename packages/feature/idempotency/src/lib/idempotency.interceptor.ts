import { IDEMPOTENT_KEY } from '@brickam/server-kit';
import {
    type CallHandler,
    type ExecutionContext,
    Injectable,
    type NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { IdempotencyService } from './idempotency.service';

/** Заголовок ключа идемпотентности (нормализуется в нижний регистр). */
const HEADER = 'idempotency-key';

type RequestUser = { sub?: string; id?: string };

type IdempotentRequest = {
    method: string;
    path: string;
    headers: Record<string, string | string[] | undefined>;
    body?: unknown;
    user?: RequestUser;
};

/**
 * Глобальный интерсептор идемпотентности. Гейтит по двум условиям: хендлер
 * помечен `@Idempotent()` (метаданные IDEMPOTENT_KEY) И в запросе есть заголовок
 * `Idempotency-Key`. Иначе — прозрачный проброс. При совпадении: `begin` либо
 * воспроизводит сохранённый ответ (replay), либо выполняет хендлер и фиксирует
 * результат (complete); при ошибке хендлера снимает pending (fail) для повтора.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        private readonly service: IdempotencyService,
    ) {}

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
        if (context.getType() !== 'http') {
            return next.handle();
        }

        const isIdempotent = this.reflector.get<boolean>(IDEMPOTENT_KEY, context.getHandler());
        const http = context.switchToHttp();
        const req = http.getRequest<IdempotentRequest>();
        const key = this.readKey(req);

        if (!isIdempotent || key === undefined) {
            return next.handle();
        }

        const res = http.getResponse<{ statusCode: number; status: (code: number) => unknown }>();
        const userId = req.user?.sub ?? req.user?.id;
        const result = await this.service.begin(key, userId, req.method, req.path, req.body);

        if ('replay' in result) {
            res.status(result.replay.statusCode);
            return of(result.replay.body);
        }

        return next.handle().pipe(
            tap((body) => {
                void this.service.complete(key, res.statusCode, body);
            }),
            catchError((err: unknown) => {
                void this.service.fail(key);
                return throwError(() => err);
            }),
        );
    }

    /** Извлекает значение заголовка ключа (учитывает массив значений). */
    private readKey(req: IdempotentRequest): string | undefined {
        const raw = req.headers[HEADER];
        const value = Array.isArray(raw) ? raw[0] : raw;
        return value !== undefined && value !== '' ? value : undefined;
    }
}
