import { KeyValueStore } from './key-value.store';

/** Запись in-memory стора: значение + момент протухания (ms epoch). */
type Entry = { value: unknown; expiresAt: number };

/**
 * In-memory реализация {@link KeyValueStore} на основе Map. Без сети.
 * Используется как дефолт-фолбэк (когда Redis не подключён) и в тестах.
 * НЕ обеспечивает консистентность между инстансами — только для dev/тестов.
 */
export class InMemoryKeyValueStore extends KeyValueStore {
    private readonly map = new Map<string, Entry>();

    async get<T>(key: string): Promise<T | null> {
        const entry = this.map.get(key);
        if (!entry) {
            return null;
        }
        if (entry.expiresAt <= Date.now()) {
            this.map.delete(key);
            return null;
        }
        return entry.value as T;
    }

    async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
        this.map.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    }

    async del(key: string): Promise<void> {
        this.map.delete(key);
    }

    async incr(key: string, ttlSeconds: number): Promise<number> {
        const now = Date.now();
        const entry = this.map.get(key);
        const alive = entry && entry.expiresAt > now;
        const current = alive ? Number(entry?.value ?? 0) : 0;
        const next = current + 1;
        // TTL ставится на первом инкременте (когда счётчик стал 1), как и в Redis.
        const expiresAt = next === 1 ? now + ttlSeconds * 1000 : (entry?.expiresAt ?? now);
        this.map.set(key, { value: next, expiresAt });
        return next;
    }
}
