import { AppConfigService } from '@brickam/config-kit';
import { type DynamicModule, Global, Module } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InMemoryKeyValueStore } from './in-memory-key-value.store';
import { KeyValueStore } from './key-value.store';
import { RedisKeyValueStore } from './redis-key-value.store';

/**
 * Глобальный модуль key-value стора. Провайдит {@link KeyValueStore}:
 * в проде — {@link RedisKeyValueStore} (ioredis по queue.redisUrl),
 * иначе — {@link InMemoryKeyValueStore}. Интегратор сервера подключает forRoot().
 */
@Global()
@Module({})
export class RedisModule {
    static forRoot(): DynamicModule {
        return {
            module: RedisModule,
            providers: [
                {
                    provide: KeyValueStore,
                    useFactory: (config: AppConfigService): KeyValueStore =>
                        config.isProduction
                            ? new RedisKeyValueStore(
                                  new Redis(config.queue.redisUrl, {
                                      lazyConnect: true,
                                      maxRetriesPerRequest: null,
                                  }),
                              )
                            : new InMemoryKeyValueStore(),
                    inject: [AppConfigService],
                },
            ],
            exports: [KeyValueStore],
        };
    }
}
