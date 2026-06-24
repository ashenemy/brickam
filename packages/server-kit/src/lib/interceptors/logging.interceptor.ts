import {
    type CallHandler,
    type ExecutionContext,
    Injectable,
    Logger,
    type NestInterceptor,
} from '@nestjs/common';
import { type Observable, tap } from 'rxjs';
import type { RequestWithContext } from '../../@types';

/** Логирует метод/URL/длительность/traceId каждого HTTP-запроса. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        if (context.getType() !== 'http') {
            return next.handle();
        }
        const request = context.switchToHttp().getRequest<RequestWithContext>();
        const { method, url } = request;
        const startedAt = Date.now();
        const trace = request.traceId ?? '-';
        return next.handle().pipe(
            tap({
                next: () =>
                    this.logger.log(`${method} ${url} ${Date.now() - startedAt}ms trace=${trace}`),
                error: () =>
                    this.logger.warn(
                        `${method} ${url} FAILED ${Date.now() - startedAt}ms trace=${trace}`,
                    ),
            }),
        );
    }
}
