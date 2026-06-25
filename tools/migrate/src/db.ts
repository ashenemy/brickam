import type { IndexDirection, IndexSpec, MigrationDb } from './types';

/** Снимок одного созданного индекса (для проверок в тестах). */
export type RecordedIndex = {
    collection: string;
    keys: Record<string, IndexDirection>;
    options: IndexSpec['options'];
};

/**
 * Тестовая реализация `MigrationDb` в памяти — позволяет прогонять
 * `runMigrations` без реального Mongo. Хранит созданные индексы и id
 * применённых миграций в множествах/массивах.
 */
export class InMemoryMigrationDb implements MigrationDb {
    /** Все созданные индексы (с дедупликацией по collection+keys). */
    readonly indexes: RecordedIndex[] = [];
    private readonly indexKeys = new Set<string>();
    private readonly appliedIds = new Set<string>();
    private readonly descriptions = new Map<string, string>();

    private composeKey(collection: string, keys: Record<string, IndexDirection>): string {
        const sorted = Object.keys(keys)
            .sort()
            .map((k) => `${k}:${String(keys[k])}`)
            .join(',');
        return `${collection}::${sorted}`;
    }

    async createIndex(
        collection: string,
        keys: Record<string, IndexDirection>,
        options?: IndexSpec['options'],
    ): Promise<void> {
        const id = this.composeKey(collection, keys);
        // Идемпотентно: повторное создание того же индекса не плодит записей.
        if (this.indexKeys.has(id)) {
            return;
        }
        this.indexKeys.add(id);
        this.indexes.push({
            collection,
            keys: { ...keys },
            options: options ? { ...options } : undefined,
        });
    }

    async applied(): Promise<Set<string>> {
        return new Set(this.appliedIds);
    }

    async markApplied(id: string, description: string): Promise<void> {
        this.appliedIds.add(id);
        this.descriptions.set(id, description);
    }

    /** Описание применённой миграции (для проверок). */
    descriptionOf(id: string): string | undefined {
        return this.descriptions.get(id);
    }

    /** Все индексы коллекции (для проверок). */
    indexesFor(collection: string): RecordedIndex[] {
        return this.indexes.filter((i) => i.collection === collection);
    }

    /** Есть ли в коллекции индекс ровно по этим ключам. */
    hasIndex(collection: string, keys: Record<string, IndexDirection>): boolean {
        return this.indexKeys.has(this.composeKey(collection, keys));
    }
}
