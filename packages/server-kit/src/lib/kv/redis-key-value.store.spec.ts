import type { Redis } from 'ioredis';
import { describe, expect, it, vi } from 'vitest';
import { RedisKeyValueStore } from './redis-key-value.store';

function makeClient() {
    return {
        set: vi.fn().mockResolvedValue('OK'),
        get: vi.fn(),
        del: vi.fn().mockResolvedValue(1),
        incr: vi.fn(),
        expire: vi.fn().mockResolvedValue(1),
    };
}

describe('RedisKeyValueStore', () => {
    it('set сериализует в JSON и ставит EX TTL', async () => {
        const client = makeClient();
        const store = new RedisKeyValueStore(client as unknown as Redis);
        await store.set('k', { a: 1 }, 60);
        expect(client.set).toHaveBeenCalledWith('k', JSON.stringify({ a: 1 }), 'EX', 60);
    });

    it('get парсит JSON', async () => {
        const client = makeClient();
        client.get.mockResolvedValue(JSON.stringify({ a: 1 }));
        const store = new RedisKeyValueStore(client as unknown as Redis);
        await expect(store.get<{ a: number }>('k')).resolves.toEqual({ a: 1 });
        expect(client.get).toHaveBeenCalledWith('k');
    });

    it('get отсутствующего ключа → null без JSON.parse', async () => {
        const client = makeClient();
        client.get.mockResolvedValue(null);
        const store = new RedisKeyValueStore(client as unknown as Redis);
        await expect(store.get('k')).resolves.toBeNull();
    });

    it('del вызывает client.del', async () => {
        const client = makeClient();
        const store = new RedisKeyValueStore(client as unknown as Redis);
        await store.del('k');
        expect(client.del).toHaveBeenCalledWith('k');
    });

    it('incr ставит EXPIRE только на первом инкременте', async () => {
        const client = makeClient();
        client.incr.mockResolvedValueOnce(1).mockResolvedValueOnce(2);
        const store = new RedisKeyValueStore(client as unknown as Redis);

        await expect(store.incr('c', 60)).resolves.toBe(1);
        expect(client.expire).toHaveBeenCalledWith('c', 60);

        client.expire.mockClear();
        await expect(store.incr('c', 60)).resolves.toBe(2);
        expect(client.expire).not.toHaveBeenCalled();
    });
});
