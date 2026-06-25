import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InMemoryKeyValueStore } from './in-memory-key-value.store';

describe('InMemoryKeyValueStore', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('set/get возвращает сохранённое значение', async () => {
        const store = new InMemoryKeyValueStore();
        await store.set('k', { a: 1 }, 60);
        await expect(store.get<{ a: number }>('k')).resolves.toEqual({ a: 1 });
    });

    it('get отсутствующего ключа → null', async () => {
        const store = new InMemoryKeyValueStore();
        await expect(store.get('missing')).resolves.toBeNull();
    });

    it('значение протухает по TTL → null', async () => {
        const store = new InMemoryKeyValueStore();
        await store.set('k', 'v', 1);
        vi.advanceTimersByTime(1_001);
        await expect(store.get('k')).resolves.toBeNull();
    });

    it('del удаляет значение', async () => {
        const store = new InMemoryKeyValueStore();
        await store.set('k', 'v', 60);
        await store.del('k');
        await expect(store.get('k')).resolves.toBeNull();
    });

    it('incr инкрементирует и ставит TTL на первом значении', async () => {
        const store = new InMemoryKeyValueStore();
        await expect(store.incr('c', 60)).resolves.toBe(1);
        await expect(store.incr('c', 60)).resolves.toBe(2);
        await expect(store.incr('c', 60)).resolves.toBe(3);
    });

    it('счётчик incr протухает по TTL первого инкремента', async () => {
        const store = new InMemoryKeyValueStore();
        await store.incr('c', 1);
        // продление TTL не должно происходить на последующих incr
        vi.advanceTimersByTime(500);
        await expect(store.incr('c', 1)).resolves.toBe(2);
        vi.advanceTimersByTime(600);
        // окно (1s от первого) истекло → счётчик сброшен
        await expect(store.incr('c', 1)).resolves.toBe(1);
    });
});
