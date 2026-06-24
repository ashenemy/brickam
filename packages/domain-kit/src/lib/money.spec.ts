import { describe, expect, it } from 'vitest';
import { applyDiscount, calcCommission, isDiscountActive, roundAmd } from './money';

describe('money (AMD)', () => {
    it('roundAmd округляет до целого', () => {
        expect(roundAmd(7.5)).toBe(8);
        expect(roundAmd(7.49)).toBe(7);
    });

    it('applyDiscount percent', () => {
        expect(applyDiscount(1000, { type: 'percent', value: 20 })).toBe(800);
        expect(applyDiscount(999, { type: 'percent', value: 10 })).toBe(899); // round(899.1)
    });

    it('applyDiscount amount, не ниже 0', () => {
        expect(applyDiscount(1000, { type: 'amount', value: 150 })).toBe(850);
        expect(applyDiscount(100, { type: 'amount', value: 500 })).toBe(0);
    });

    it('неактивная скидка (окно) не применяется', () => {
        const now = new Date('2026-06-01T00:00:00Z');
        const future = { type: 'percent', value: 50, activeFrom: '2026-07-01T00:00:00Z' } as const;
        expect(isDiscountActive(future, now)).toBe(false);
        expect(applyDiscount(1000, future, now)).toBe(1000);
        const past = { type: 'percent', value: 50, activeTo: '2026-05-01T00:00:00Z' } as const;
        expect(applyDiscount(1000, past, now)).toBe(1000);
    });

    it('calcCommission = round(after * pct/100)', () => {
        expect(calcCommission(800, 7.5)).toBe(60);
        expect(calcCommission(1333, 7.5)).toBe(100); // round(99.975)
    });
});
