import { describe, expect, it } from 'vitest';
import { applyWaste, ceil, round2 } from './math.util';

describe('math.util', () => {
    describe('applyWaste', () => {
        it('добавляет процент запаса', () => {
            expect(applyWaste(100, 5)).toBe(105);
            expect(applyWaste(10, 10)).toBe(11);
        });
        it('0% запаса не меняет значение', () => {
            expect(applyWaste(42, 0)).toBe(42);
        });
        it('0 на входе → 0 при любом запасе', () => {
            expect(applyWaste(0, 10)).toBe(0);
        });
        it('больше запас → не меньше результат', () => {
            expect(applyWaste(100, 20)).toBeGreaterThanOrEqual(applyWaste(100, 10));
        });
    });

    describe('round2', () => {
        it('округляет до 2 знаков', () => {
            expect(round2(10.5)).toBe(10.5);
            expect(round2(1.005)).toBeCloseTo(1.0, 2);
            expect(round2(2.345)).toBe(2.35);
            expect(round2(7.126)).toBe(7.13);
        });
    });

    describe('ceil', () => {
        it('округляет вверх', () => {
            expect(ceil(4.2)).toBe(5);
            expect(ceil(4.0)).toBe(4);
            expect(ceil(0)).toBe(0);
            expect(ceil(0.1)).toBe(1);
        });
    });
});
