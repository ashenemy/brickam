import { applyDiscount } from '@brickam/domain-kit';
import type { InvoiceDiscount, InvoiceLineItem, InvoiceTotals } from '../@types';

/**
 * Чистый расчёт итогов инвойса (целые AMD).
 * subtotal = Σ price*qty; total = applyDiscount(subtotal, discount) из money.
 * Скидка инвойса не имеет временного окна → передаём без activeFrom/To
 * (money.applyDiscount считает её активной).
 */
export const computeTotals = (
    lineItems: InvoiceLineItem[],
    discount?: InvoiceDiscount,
): InvoiceTotals => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const total = applyDiscount(subtotal, discount);
    return { subtotal, total };
};

/** Просрочен ли инвойс к моменту `now` (validUntil строго в прошлом). */
export const isExpired = (validUntil: Date, now: Date = new Date()): boolean =>
    validUntil.getTime() < now.getTime();
