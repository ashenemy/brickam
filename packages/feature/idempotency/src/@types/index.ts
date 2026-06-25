/** Состояние записи идемпотентного ключа. */
export type IdempotencyStatus = 'pending' | 'completed';

/** Сохранённый результат идемпотентной операции (для воспроизведения ответа). */
export type IdempotencyReplay = {
    statusCode: number;
    body: unknown;
};

/**
 * Результат `IdempotencyService.begin`: либо воспроизвести сохранённый ответ
 * (`replay`), либо выполнить операцию впервые (`proceed`).
 */
export type IdempotencyBeginResult = { replay: IdempotencyReplay } | { proceed: true };
