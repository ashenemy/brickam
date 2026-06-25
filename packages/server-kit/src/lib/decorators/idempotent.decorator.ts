import { SetMetadata } from '@nestjs/common';

/** Ключ метаданных идемпотентности (читается IdempotencyInterceptor). */
export const IDEMPOTENT_KEY = 'idempotent';

/**
 * Помечает мутирующий хендлер как идемпотентный: при наличии заголовка
 * `Idempotency-Key` повторный запрос с тем же ключом не выполнит операцию
 * дважды, а вернёт сохранённый ответ (см. IdempotencyInterceptor).
 */
export const Idempotent = () => SetMetadata(IDEMPOTENT_KEY, true);
