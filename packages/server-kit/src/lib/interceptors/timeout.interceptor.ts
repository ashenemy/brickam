import { ServiceUnavailableException } from '@brickam/core-kit';
import {
    type CallHandler,
    type ExecutionContext,
    Inject,
    Injectable,
    type NestInterceptor,
} from '@nestjs/common';
import { catchError, type Observable, TimeoutError, throwError, timeout } from 'rxjs';
import { REQUEST_TIMEOUT_MS } from '../../@types';

/** Прерывает слишком долгие запросы (лимит из конфига) → 503. */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
    constructor(@Inject(REQUEST_TIMEOUT_MS) private readonly timeoutMs: number) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        if (context.getType() !== 'http') {
            return next.handle();
        }
        return next.handle().pipe(
            timeout(this.timeoutMs),
            catchError((error: unknown) =>
                error instanceof TimeoutError
                    ? throwError(() => new ServiceUnavailableException('errors.serviceUnavailable'))
                    : throwError(() => error),
            ),
        );
    }
}
