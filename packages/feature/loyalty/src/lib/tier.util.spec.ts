import { describe, expect, it } from 'vitest';
import type { Tier } from '../@types';
import { computeLoyaltyDiscount, selectTier, tierId } from './tier.util';

const tiers: Tier[] = [
    { level: 1, name: 'Bronze', threshold: 0, discountType: 'percent', discountValue: 0 },
    { level: 2, name: 'Silver', threshold: 100000, discountType: 'percent', discountValue: 3 },
    { level: 3, name: 'Gold', threshold: 500000, discountType: 'percent', discountValue: 5 },
];

describe('selectTier', () => {
    it('ровно на threshold возвращает этот уровень', () => {
        expect(selectTier(tiers, 100000)?.level).toBe(2);
        expect(selectTier(tiers, 500000)?.level).toBe(3);
    });

    it('между порогами возвращает нижний достигнутый', () => {
        expect(selectTier(tiers, 250000)?.level).toBe(2);
        expect(selectTier(tiers, 50000)?.level).toBe(1);
    });

    it('выше последнего порога возвращает последний уровень', () => {
        expect(selectTier(tiers, 9_000_000)?.level).toBe(3);
    });

    it('на нуле возвращает Bronze (threshold 0)', () => {
        expect(selectTier(tiers, 0)?.level).toBe(1);
    });

    it('ниже первого порога (все threshold>metric) → undefined', () => {
        const positiveTiers: Tier[] = [
            {
                level: 2,
                name: 'Silver',
                threshold: 100000,
                discountType: 'percent',
                discountValue: 3,
            },
            {
                level: 3,
                name: 'Gold',
                threshold: 500000,
                discountType: 'percent',
                discountValue: 5,
            },
        ];
        expect(selectTier(positiveTiers, 50000)).toBeUndefined();
    });

    it('пустой список уровней → undefined', () => {
        expect(selectTier([], 1000)).toBeUndefined();
    });
});

describe('computeLoyaltyDiscount', () => {
    const percent = (v: number): Tier => ({
        level: 1,
        name: 'P',
        threshold: 0,
        discountType: 'percent',
        discountValue: v,
    });
    const amount = (v: number): Tier => ({
        level: 1,
        name: 'A',
        threshold: 0,
        discountType: 'amount',
        discountValue: v,
    });

    it('percent: округляет до целого AMD', () => {
        expect(computeLoyaltyDiscount(10000, percent(5))).toBe(500);
        // 3333 * 3 / 100 = 99.99 → 100
        expect(computeLoyaltyDiscount(3333, percent(3))).toBe(100);
    });

    it('amount: min(discountValue, amount)', () => {
        expect(computeLoyaltyDiscount(10000, amount(1500))).toBe(1500);
        expect(computeLoyaltyDiscount(1000, amount(1500))).toBe(1000);
    });

    it('clamp в [0, amount] и неотрицательность', () => {
        expect(computeLoyaltyDiscount(10000, percent(200))).toBe(10000);
        expect(computeLoyaltyDiscount(10000, percent(0))).toBe(0);
        expect(computeLoyaltyDiscount(0, percent(5))).toBe(0);
        expect(computeLoyaltyDiscount(10000, amount(-100))).toBe(0);
    });

    it('результат — целое число', () => {
        const d = computeLoyaltyDiscount(1234, percent(7));
        expect(Number.isInteger(d)).toBe(true);
    });
});

describe('tierId', () => {
    it('равен String(level)', () => {
        expect(tierId(tiers[1] as Tier)).toBe('2');
    });
});
