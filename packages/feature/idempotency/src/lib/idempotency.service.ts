import { createHash } from 'node:crypto';
import { ConflictException } from '@brickam/core-kit';
import { Injectable } from '@nestjs/common';
import type { IdempotencyBeginResult } from '../@types';
import { IdempotencyRepository } from './idempotency.repository';

/**
 * Логика идемпотентности мутирующих запросов. Хранит ключи в коллекции
 * `idempotency_keys`; `fingerprint` (sha256 от метода/пути/userId/тела) ловит
 * повтор того же ключа с другим телом → 409. Гонка конкурентных запросов
 * разрешается уникальным индексом по `key` (insertPending → null → 409).
 */
@Injectable()
export class IdempotencyService {
    constructor(private readonly repository: IdempotencyRepository) {}

    /**
     * Детерминированный хеш запроса: одинаков для повтора с тем же телом и
     * различается при изменении метода/пути/пользователя/тела.
     */
    fingerprint(method: string, path: string, userId: string | undefined, body: unknown): string {
        const payload = `${method}|${path}|${userId ?? ''}|${JSON.stringify(body ?? null)}`;
        return createHash('sha256').update(payload).digest('hex');
    }

    /**
     * Открывает идемпотентную операцию по ключу:
     * - completed + тот же fingerprint → воспроизвести сохранённый ответ;
     * - completed + другой fingerprint → 409 (ключ переиспользован с иным телом);
     * - pending → 409 (операция ещё выполняется / конкурентный запрос);
     * - нет записи → вставить pending и `proceed` (при гонке вставки → 409).
     */
    async begin(
        key: string,
        userId: string | undefined,
        method: string,
        path: string,
        body: unknown,
    ): Promise<IdempotencyBeginResult> {
        const fingerprint = this.fingerprint(method, path, userId, body);
        const existing = await this.repository.findByKey(key);

        if (existing) {
            if (existing.fingerprint !== fingerprint) {
                throw new ConflictException('errors.idempotency.keyConflict');
            }
            if (existing.status === 'completed') {
                return {
                    replay: { statusCode: existing.statusCode ?? 200, body: existing.response },
                };
            }
            throw new ConflictException('errors.idempotency.inProgress');
        }

        const inserted = await this.repository.insertPending({
            key,
            ...(userId !== undefined ? { userId } : {}),
            method,
            path,
            fingerprint,
            status: 'pending',
        });
        if (!inserted) {
            throw new ConflictException('errors.idempotency.inProgress');
        }
        return { proceed: true };
    }

    /** Фиксирует успешный результат операции (status → completed). */
    async complete(key: string, statusCode: number, body: unknown): Promise<void> {
        await this.repository.markCompleted(key, statusCode, body);
    }

    /** Удаляет pending-запись после ошибки хендлера — чтобы клиент мог повторить. */
    async fail(key: string): Promise<void> {
        await this.repository.deleteByKey(key);
    }
}
