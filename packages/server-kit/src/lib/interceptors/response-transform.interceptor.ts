import type { ResponseEnvelope } from '@brickam/core-kit';
import {
    type CallHandler,
    type ExecutionContext,
    Injectable,
    type NestInterceptor,
} from '@nestjs/common';
import { map, type Observable } from 'rxjs';

const isEnvelope = (value: unknown): boolean =>
    typeof value === 'object' && value !== null && 'success' in value;

const isPage = (value: unknown): value is { data: unknown; meta: unknown } =>
    typeof value === 'object' && value !== null && 'data' in value && 'meta' in value;

/**
 * Последний в цепочке: оборачивает результат в унифицированный конверт успеха
 * {success:true, data, meta?}. Страницы {data,meta} разворачиваются в конверт с meta.
 */
@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, ResponseEnvelope<T>> {
    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ResponseEnvelope<T>> {
        if (context.getType() !== 'http') {
            return next.handle() as unknown as Observable<ResponseEnvelope<T>>;
        }
        return next.handle().pipe(
            map((payload): ResponseEnvelope<T> => {
                if (isEnvelope(payload)) {
                    return payload as unknown as ResponseEnvelope<T>;
                }
                if (isPage(payload)) {
                    return {
                        success: true,
                        data: payload.data as T,
                        meta: payload.meta as Record<string, unknown>,
                    };
                }
                return { success: true, data: payload };
            }),
        );
    }
}
