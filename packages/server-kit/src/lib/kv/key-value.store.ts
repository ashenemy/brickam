/**
 * Абстракция key-value хранилища для распределённого состояния (OTP, refresh-токены
 * и т.п.). В проде — Redis (мультиинстансная консистентность), в dev/тестах — in-memory.
 */
export abstract class KeyValueStore {
    /** Возвращает значение по ключу или null (с учётом протухания TTL). */
    abstract get<T>(key: string): Promise<T | null>;

    /** Сохраняет значение с TTL в секундах. */
    abstract set(key: string, value: unknown, ttlSeconds: number): Promise<void>;

    /** Удаляет значение по ключу. */
    abstract del(key: string): Promise<void>;

    /**
     * Атомарный инкремент счётчика. На первом инкременте (значение стало 1)
     * устанавливает TTL в секундах. Возвращает новое значение счётчика.
     */
    abstract incr(key: string, ttlSeconds: number): Promise<number>;
}
