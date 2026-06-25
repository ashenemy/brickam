import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { IdempotencyKey, type IdempotencyKeyDocument } from './idempotency-key.schema';

/** Код ошибки дубликата ключа MongoDB (E11000). */
const DUPLICATE_KEY_ERROR = 11000;

/** Репозиторий идемпотентных ключей поверх Mongoose-модели IdempotencyKey. */
@Injectable()
export class IdempotencyRepository extends BaseRepository<IdempotencyKey> {
    constructor(@InjectModel(IdempotencyKey.name) model: Model<IdempotencyKey>) {
        super(model);
    }

    /** Находит запись по уникальному ключу идемпотентности. */
    findByKey(key: string): Promise<IdempotencyKeyDocument | null> {
        return this.findOne({ key });
    }

    /**
     * Атомарно вставляет pending-запись. При гонке конкурентных запросов
     * (duplicate key E11000) возвращает `null` — ключ уже занят другим
     * запросом; прочие ошибки пробрасываются.
     */
    async insertPending(doc: Partial<IdempotencyKey>): Promise<IdempotencyKeyDocument | null> {
        try {
            return await this.create(doc);
        } catch (error) {
            if (this.isDuplicateKey(error)) {
                return null;
            }
            throw error;
        }
    }

    /** Помечает запись завершённой, сохраняя статус-код и тело ответа. */
    markCompleted(
        key: string,
        statusCode: number,
        response: unknown,
    ): Promise<IdempotencyKeyDocument | null> {
        return this.updateByKey(key, { status: 'completed', statusCode, response });
    }

    /** Удаляет pending-запись по ключу (после ошибки хендлера — чтобы повторить). */
    async deleteByKey(key: string): Promise<boolean> {
        const result = await this.model.deleteOne({ key }).exec();
        return result.deletedCount > 0;
    }

    private updateByKey(
        key: string,
        update: Partial<IdempotencyKey>,
    ): Promise<IdempotencyKeyDocument | null> {
        return this.model.findOneAndUpdate({ key }, update, { new: true }).exec();
    }

    private isDuplicateKey(error: unknown): boolean {
        return (
            typeof error === 'object' &&
            error !== null &&
            (error as { code?: number }).code === DUPLICATE_KEY_ERROR
        );
    }
}
