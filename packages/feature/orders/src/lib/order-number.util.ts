import { randomUUID } from 'node:crypto';

/**
 * Генератор человекочитаемого номера заказа вида `BH-<base36(now)>-<suffix>`.
 * Время даёт монотонную часть, короткий случайный суффикс из UUID — защиту от
 * коллизий при пакетной генерации в одну миллисекунду.
 */
export function generateOrderNumber(now: number = Date.now()): string {
    const time = now.toString(36).toUpperCase();
    const suffix = randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase();
    return `BH-${time}-${suffix}`;
}
