import {
    type CallHandler,
    type ExecutionContext,
    Injectable,
    type NestInterceptor,
    type Type,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { map, type Observable } from 'rxjs';

/** Преобразует результат в экземпляр DTO (для @Exclude/@Expose и ClassSerializer). */
@Injectable()
export class SerializeInterceptor implements NestInterceptor {
    constructor(private readonly dto: Type) {}

    intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
        return next
            .handle()
            .pipe(
                map((data) =>
                    data === null || data === undefined
                        ? data
                        : plainToInstance(this.dto, data, { excludeExtraneousValues: false }),
                ),
            );
    }
}
