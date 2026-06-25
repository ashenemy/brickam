import type { Connection } from 'mongoose';
import type { IndexDirection, IndexSpec, MigrationDb } from './types';

/** Имя коллекции-журнала применённых миграций. */
export const MIGRATIONS_COLLECTION = 'migrations';

/** Форма документа журнала миграций (строковый `_id` = id миграции). */
type MigrationLog = {
    _id: string;
    description: string;
    at: Date;
};

/**
 * Продакшен-реализация `MigrationDb` поверх mongoose-соединения.
 *
 * - `createIndex` → `connection.collection(coll).createIndex(keys, options)`.
 *   Идемпотентно: MongoDB не пересоздаёт идентичный индекс (тот же ключ+опции),
 *   повторный вызов — no-op.
 * - Журнал — коллекция `migrations`: `_id` = id миграции,
 *   `updateOne({_id}, {$setOnInsert:{description, at}}, {upsert:true})`.
 *   `at` фиксируется через явный `now` (детерминируемость вне логики).
 */
export class MongoMigrationDb implements MigrationDb {
    constructor(
        private readonly connection: Connection,
        private readonly now: Date = new Date(),
    ) {}

    async createIndex(
        collection: string,
        keys: Record<string, IndexDirection>,
        options?: IndexSpec['options'],
    ): Promise<void> {
        await this.connection.collection(collection).createIndex(keys, { ...options });
    }

    async applied(): Promise<Set<string>> {
        // `_id` миграций — строковые id ('0001-...'), не ObjectId.
        const coll = this.connection.collection<MigrationLog>(MIGRATIONS_COLLECTION);
        const docs = await coll.find({}, { projection: { _id: 1 } }).toArray();
        return new Set(docs.map((d) => d._id));
    }

    async markApplied(id: string, description: string): Promise<void> {
        const coll = this.connection.collection<MigrationLog>(MIGRATIONS_COLLECTION);
        await coll.updateOne(
            { _id: id },
            { $setOnInsert: { description, at: this.now } },
            { upsert: true },
        );
    }
}
