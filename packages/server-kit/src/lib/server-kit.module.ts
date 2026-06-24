import { AppConfigService } from '@brickam/config-kit';
import {
    ClassSerializerInterceptor,
    type DynamicModule,
    Module,
    type Provider,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { REQUEST_TIMEOUT_MS } from '../@types';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { RequestContextInterceptor } from './interceptors/request-context.interceptor';
import { ResponseTransformInterceptor } from './interceptors/response-transform.interceptor';
import { TimeoutInterceptor } from './interceptors/timeout.interceptor';
import { createValidationPipe } from './pipes/validation';

/**
 * Регистрирует глобальные провайдеры платформы:
 * порядок interceptors RequestContext→Logging→Timeout→ClassSerializer→ResponseTransform,
 * AllExceptionsFilter и ValidationPipe (whitelist+forbidNonWhitelisted+transform).
 */
@Module({})
export class ServerKitModule {
    static forRoot(): DynamicModule {
        const providers: Provider[] = [
            {
                provide: REQUEST_TIMEOUT_MS,
                useFactory: (config: AppConfigService) => config.server.requestTimeoutMs,
                inject: [AppConfigService],
            },
            { provide: APP_INTERCEPTOR, useClass: RequestContextInterceptor },
            { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
            { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
            { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
            { provide: APP_INTERCEPTOR, useClass: ResponseTransformInterceptor },
            { provide: APP_FILTER, useClass: AllExceptionsFilter },
            { provide: APP_PIPE, useFactory: () => createValidationPipe() },
        ];
        return {
            module: ServerKitModule,
            providers,
            exports: [REQUEST_TIMEOUT_MS],
        };
    }
}
