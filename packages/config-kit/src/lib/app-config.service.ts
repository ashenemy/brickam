import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG } from '../@types';
import type { AppConfig } from './config-schema';

/**
 * Типизированный доступ к валидированному конфигу по неймспейсам.
 * Внедряется глобально через ConfigKitModule.forRoot().
 */
@Injectable()
export class AppConfigService {
    constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

    /** Доступ к неймспейсу конфига целиком. */
    get<K extends keyof AppConfig>(namespace: K): AppConfig[K] {
        return this.config[namespace];
    }

    get all(): AppConfig {
        return this.config;
    }

    get server(): AppConfig['server'] {
        return this.config.server;
    }

    get auth(): AppConfig['auth'] {
        return this.config.auth;
    }

    get pagination(): AppConfig['pagination'] {
        return this.config.pagination;
    }

    get marketplace(): AppConfig['marketplace'] {
        return this.config.marketplace;
    }

    get providers(): AppConfig['providers'] {
        return this.config.providers;
    }

    get features(): AppConfig['features'] {
        return this.config.features;
    }

    get database(): AppConfig['database'] {
        return this.config.database;
    }

    get queue(): AppConfig['queue'] {
        return this.config.queue;
    }

    get secrets(): AppConfig['secrets'] {
        return this.config.secrets;
    }

    get isProduction(): boolean {
        return this.config.env.nodeEnv === 'production';
    }

    get isDevelopment(): boolean {
        return this.config.env.nodeEnv === 'development';
    }
}
