import { describe, expect, it } from 'vitest';
import type { InvoiceLineItem } from '../@types';
import { computeTotals, isExpired } from './invoice-calc.util';

const items: InvoiceLineItem[] = [
    { title: 'A', qty: 2, price: 1000 },
    { title: 'B', qty: 1, price: 500 },
];

describe('computeTotals', () => {
    it('считает subtotal без скидки (total = subtotal)', () => {
        // 2*1000 + 1*500 = 2500
        expect(computeTotals(items)).toEqual({ subtotal: 2500, total: 2500 });
    });

    it('применяет процентную скидку (округление до целого AMD)', () => {
        // 2500 * (1 - 10/100) = 2250
        expect(computeTotals(items, { type: 'percent', value: 10 })).toEqual({
            subtotal: 2500,
            total: 2250,
        });
    });

    it('округляет дробный процент до целого AMD', () => {
        // subtotal 999, скидка 33% → 999 * 0.67 = 669.33 → 669
        const one: InvoiceLineItem[] = [{ title: 'X', qty: 1, price: 999 }];
        expect(computeTotals(one, { type: 'percent', value: 33 })).toEqual({
            subtotal: 999,
            total: 669,
        });
    });

    it('применяет скидку суммой', () => {
        expect(computeTotals(items, { type: 'amount', value: 700 })).toEqual({
            subtotal: 2500,
            total: 1800,
        });
    });

    it('не уходит ниже нуля при чрезмерной скидке суммой', () => {
        expect(computeTotals(items, { type: 'amount', value: 999999 })).toEqual({
            subtotal: 2500,
            total: 0,
        });
    });
});

describe('isExpired', () => {
    const now = new Date('2026-06-25T12:00:00Z');

    it('false для будущей даты', () => {
        expect(isExpired(new Date('2026-06-26T12:00:00Z'), now)).toBe(false);
    });

    it('true для прошедшей даты', () => {
        expect(isExpired(new Date('2026-06-24T12:00:00Z'), now)).toBe(true);
    });
});
