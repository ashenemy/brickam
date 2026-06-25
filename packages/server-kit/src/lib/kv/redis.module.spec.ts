import type { AppConfigService } from '@brickam/config-kit';
import type { Provider } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { InMemoryKeyValueStore } from './in-memory-key-value.store';
import { KeyValueStore } from './key-value.store';
import { RedisModule } from './redis.module';

type FactoryProvider = {
    provide: unknown;
    useFactory: (config: AppConfigService) => KeyValueStore;
    inject: unknown[];
};

function factoryFor(): FactoryProvider {
    const dyn = RedisModule.forRoot();
    const provider = (dyn.providers as Provider[]).find(
        (p) => (p as { provide?: unknown }).provide === KeyValueStore,
    );
    return provider as unknown as FactoryProvider;
}

describe('RedisModule.forRoot', () => {
    it('экспортит KeyValueStore', () => {
        const dyn = RedisModule.forRoot();
        expect(dyn.exports).toContain(KeyValueStore);
    });

    it('вне прода фабрика возвращает InMemoryKeyValueStore', () => {
        const config = { isProduction: false } as unknown as AppConfigService;
        const store = factoryFor().useFactory(config);
        expect(store).toBeInstanceOf(InMemoryKeyValueStore);
    });
});
