/**
 * Абстракция хранилища для идемпотентного сидирования. Билдеры не знают про
 * Mongo: они отдают датасеты, а RUNNER применяет их через `SeedStore`.
 *
 * Идемпотентность достигается стабильным `key`: повторный `upsert` с тем же
 * ключом обновляет существующий документ ('updated'), а не плодит дубль.
 */
export type UpsertResult = 'inserted' | 'updated';

export type SeedStore = {
    upsert(
        collection: string,
        key: Record<string, unknown>,
        doc: Record<string, unknown>,
    ): Promise<UpsertResult>;
};

/**
 * Тестовое хранилище в памяти. Ключ записи — `collection + JSON(key)`, поэтому
 * повторный прогон с тем же стабильным ключом перезаписывает запись (нет
 * дублей). Позволяет прогонять `runSeed` без реального Mongo.
 */
export class InMemorySeedStore implements SeedStore {
    private readonly data = new Map<string, Record<string, unknown>>();

    private composeKey(collection: string, key: Record<string, unknown>): string {
        // Стабильная сериализация ключа: сортируем поля, чтобы порядок не влиял.
        const sorted = Object.keys(key)
            .sort()
            .reduce<Record<string, unknown>>((acc, k) => {
                acc[k] = key[k];
                return acc;
            }, {});
        return `${collection}::${JSON.stringify(sorted)}`;
    }

    async upsert(
        collection: string,
        key: Record<string, unknown>,
        doc: Record<string, unknown>,
    ): Promise<UpsertResult> {
        const id = this.composeKey(collection, key);
        const exists = this.data.has(id);
        this.data.set(id, { ...key, ...doc });
        return exists ? 'updated' : 'inserted';
    }

    /** Снимок коллекции (для проверок в тестах). */
    documents(collection: string): Record<string, unknown>[] {
        const prefix = `${collection}::`;
        const out: Record<string, unknown>[] = [];
        for (const [id, value] of this.data) {
            if (id.startsWith(prefix)) {
                out.push(value);
            }
        }
        return out;
    }

    /** Размер коллекции (для проверки идемпотентности). */
    count(collection: string): number {
        return this.documents(collection).length;
    }
}
