import { describe, expect, it } from 'vitest';
import type { Discount } from '../@types';
import { computeFinalPrice, isDiscountActive } from './discount.util';

const NOW = new Date('2026-06-25T12:00:00Z');

describe('isDiscountActive', () => {
    it('нет скидки → не активна', () => {
        expect(isDiscountActive(undefined, NOW)).toBe(false);
    });

    it('без окна → всегда активна', () => {
        const d: Discount = { type: 'percent', value: 10 };
        expect(isDiscountActive(d, NOW)).toBe(true);
    });

    it('now до activeFrom → не активна', () => {
        const d: Discount = { type: 'percent', value: 10, activeFrom: new Date('2026-07-01') };
        expect(isDiscountActive(d, NOW)).toBe(false);
    });

    it('now после activeTo → не активна', () => {
        const d: Discount = { type: 'percent', value: 10, activeTo: new Date('2026-06-01') };
        expect(isDiscountActive(d, NOW)).toBe(false);
    });

    it('now внутри окна → активна', () => {
        const d: Discount = {
            type: 'percent',
            value: 10,
            activeFrom: new Date('2026-06-01'),
            activeTo: new Date('2026-07-01'),
        };
        expect(isDiscountActive(d, NOW)).toBe(true);
    });
});

describe('computeFinalPrice', () => {
    it('нет скидки → исходная цена', () => {
        expect(computeFinalPrice(1000, undefined, NOW)).toBe(1000);
    });

    it('percent: округляет', () => {
        // 999 * (1 - 0.1) = 899.1 → 899
        expect(computeFinalPrice(999, { type: 'percent', value: 10 }, NOW)).toBe(899);
    });

    it('percent: округление вверх до целого', () => {
        // 1005 * 0.85 = 854.25 → 854
        expect(computeFinalPrice(1005, { type: 'percent', value: 15 }, NOW)).toBe(854);
    });

    it('amount: вычитает и не уходит ниже нуля', () => {
        expect(computeFinalPrice(1000, { type: 'amount', value: 300 }, NOW)).toBe(700);
        expect(computeFinalPrice(200, { type: 'amount', value: 500 }, NOW)).toBe(0);
    });

    it('amount: округляет', () => {
        expect(computeFinalPrice(1000, { type: 'amount', value: 99.6 }, NOW)).toBe(900);
    });

    it('неактивное окно → исходная цена', () => {
        const d: Discount = {
            type: 'percent',
            value: 50,
            activeFrom: new Date('2026-07-01'),
        };
        expect(computeFinalPrice(1000, d, NOW)).toBe(1000);
    });
});
