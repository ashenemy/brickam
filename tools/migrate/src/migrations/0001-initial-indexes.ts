import { INDEX_SPECS } from '../index-specs';
import type { Migration } from '../types';

/**
 * Начальная миграция: создаёт все канонические индексы (INDEX_SPECS).
 * В проде autoIndex выключен, поэтому индексы строит именно эта миграция.
 * Идемпотентна: повторное создание идентичного индекса в MongoDB — no-op.
 */
export const initialIndexes: Migration = {
    id: '0001-initial-indexes',
    description: 'Создание канонических индексов для всех коллекций',
    async up(db) {
        for (const spec of INDEX_SPECS) {
            await db.createIndex(spec.collection, spec.keys, spec.options);
        }
    },
};
