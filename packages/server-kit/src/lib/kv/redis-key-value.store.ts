import type { Redis } from 'ioredis';
import { KeyValueStore } from './key-value.store';

/**
 * Redis-реализация {@link KeyValueStore} поверх ioredis. Значения сериализуются
 * через JSON. Обеспечивает мультиинстансную консистентность (общий стор).
 * Клиент ioredis передаётся в конструктор (DI/фабрика).
 */
export class RedisKeyValueStore extends KeyValueStore {
    constructor(private readonly client: Redis) {
        super();
    }

    async get<T>(key: string): Promise<T | null> {
        const raw = await this.client.get(key);
        if (raw === null) {
            return null;
        }
        return JSON.parse(raw) as T;
    }

    async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
        await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    async incr(key: string, ttlSeconds: number): Promise<number> {
        const next = await this.client.incr(key);
        // TTL ставится только на первом инкременте, чтобы не продлевать окно.
        if (next === 1) {
            await this.client.expire(key, ttlSeconds);
        }
        return next;
    }
}
