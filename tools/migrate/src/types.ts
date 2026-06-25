/**
 * Типы инструмента миграций БД. Миграции версионированы, идемпотентны и
 * отслеживаются в коллекции `migrations`. Чистая логика (`run-migrations`,
 * `index-specs`) не знает про mongoose — она работает через абстракцию
 * `MigrationDb` (см. db.ts).
 */

/** Направление/тип ключа индекса MongoDB. */
export type IndexDirection = 1 | -1 | 'text';

/**
 * Канонический спек одного индекса. Задаётся ЯВНО (а не выводится из ODM),
 * поэтому служит и документацией, и источником истины независимо от схем фич.
 */
export type IndexSpec = {
    collection: string;
    keys: Record<string, IndexDirection>;
    options?: {
        unique?: boolean;
        name?: string;
        /** TTL: документ удаляется через N секунд после значения индексируемого поля. */
        expireAfterSeconds?: number;
    };
};

/** Минимальный контракт БД, нужный миграциям. Реализуется Mongo/InMemory. */
export type MigrationDb = {
    /** Создаёт индекс. Идемпотентно: повторный вызов с тем же спеком — не ошибка. */
    createIndex(
        collection: string,
        keys: Record<string, IndexDirection>,
        options?: IndexSpec['options'],
    ): Promise<void>;
    /** Множество id уже применённых миграций (из коллекции `migrations`). */
    applied(): Promise<Set<string>>;
    /** Помечает миграцию применённой (upsert в `migrations`). */
    markApplied(id: string, description: string): Promise<void>;
};

/** Одна версионированная миграция. `up` идемпотентна сама по себе. */
export type Migration = {
    id: string;
    description: string;
    up: (db: MigrationDb) => Promise<void>;
};

/** Итоговый отчёт прогона миграций. */
export type MigrationReport = {
    /** id миграций, применённых в этом прогоне. */
    applied: string[];
    /** id миграций, пропущенных (уже были применены ранее). */
    skipped: string[];
};
