import type { Connection } from 'mongoose';
import type { SeedStore, UpsertResult } from './store';

/**
 * Продакшен-реализация store поверх mongoose. Идемпотентность — через
 * `updateOne(key, { $set, $setOnInsert: { createdAt } }, { upsert: true })`:
 * совпадение по стабильному `key` обновляет документ, отсутствие — вставляет.
 * `now` передаётся явно (детерминируемость createdAt при сидировании).
 */
export class MongoSeedStore implements SeedStore {
    constructor(
        private readonly connection: Connection,
        private readonly now: Date = new Date(),
    ) {}

    async upsert(
        collection: string,
        key: Record<string, unknown>,
        doc: Record<string, unknown>,
    ): Promise<UpsertResult> {
        // `_id` иммутабелен: его нельзя ставить через $set при апдейте. Кладём в
        // $setOnInsert (применяется только при вставке), остальное — в $set.
        const { _id, ...rest } = doc;
        const setOnInsert: Record<string, unknown> = { createdAt: this.now };
        if (_id !== undefined) {
            setOnInsert['_id'] = _id;
        }

        const result = await this.connection.collection(collection).updateOne(
            key,
            {
                $set: { ...rest, updatedAt: this.now },
                $setOnInsert: setOnInsert,
            },
            { upsert: true },
        );
        return result.upsertedCount > 0 ? 'inserted' : 'updated';
    }
}
