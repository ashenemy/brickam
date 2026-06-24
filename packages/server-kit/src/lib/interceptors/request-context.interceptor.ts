import { randomUUID } from 'node:crypto';
import {
    type CallHandler,
    type ExecutionContext,
    Injectable,
    type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { type RequestWithContext, TRACE_ID_HEADER } from '../../@types';

/**
 * Первый в цепочке: проставляет traceId на запрос и в заголовок ответа.
 * traceId переиспользуется логированием и фильтром ошибок.
 */
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        if (context.getType() !== 'http') {
            return next.handle();
        }
        const http = context.switchToHttp();
        const request = http.getRequest<RequestWithContext>();
        const response = http.getResponse();
        const incoming = request.headers[TRACE_ID_HEADER];
        const traceId = (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();
        request.traceId = traceId;
        if (typeof response.setHeader === 'function') {
            response.setHeader(TRACE_ID_HEADER, traceId);
        }
        return next.handle();
    }
}
