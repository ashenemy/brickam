import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { IdempotencyRepository } from './idempotency.repository';
import { IdempotencyService } from './idempotency.service';
import { IdempotencyKey, IdempotencyKeySchema } from './idempotency-key.schema';

/**
 * Глобальный модуль идемпотентности. Регистрирует IdempotencyInterceptor как
 * APP_INTERCEPTOR (через useExisting — один экземпляр доступен и на инжект, и
 * глобально). @Global: интерсептор должен гейтить мутации любого feature.
 */
@Global()
@Module({
    imports: [
        MongooseModule.forFeature([{ name: IdempotencyKey.name, schema: IdempotencyKeySchema }]),
    ],
    providers: [
        IdempotencyRepository,
        IdempotencyService,
        IdempotencyInterceptor,
        { provide: APP_INTERCEPTOR, useExisting: IdempotencyInterceptor },
    ],
    exports: [IdempotencyService],
})
export class IdempotencyModule {}
