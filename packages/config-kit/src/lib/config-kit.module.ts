import { type DynamicModule, Global, Module } from '@nestjs/common';
import { APP_CONFIG, type LoadConfigOptions } from '../@types';
import { AppConfigService } from './app-config.service';
import { loadConfig } from './config-loader';

/**
 * Глобальный модуль конфигурации. forRoot() загружает и ВАЛИДИРУЕТ конфиг
 * немедленно (fail-fast на старте приложения) и предоставляет AppConfigService.
 */
@Global()
@Module({})
export class ConfigKitModule {
    static forRoot(options: LoadConfigOptions = {}): DynamicModule {
        const config = loadConfig(options);
        return {
            module: ConfigKitModule,
            providers: [{ provide: APP_CONFIG, useValue: config }, AppConfigService],
            exports: [AppConfigService, APP_CONFIG],
        };
    }
}
