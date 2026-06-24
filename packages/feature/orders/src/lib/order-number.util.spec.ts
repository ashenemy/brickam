import { describe, expect, it } from 'vitest';
import { generateOrderNumber } from './order-number.util';

describe('generateOrderNumber', () => {
    it('начинается с префикса BH- и содержит две части', () => {
        const num = generateOrderNumber(1_700_000_000_000);
        expect(num.startsWith('BH-')).toBe(true);
        expect(num.split('-')).toHaveLength(3);
    });

    it('кодирует время в base36 (верхний регистр)', () => {
        const now = 1_700_000_000_000;
        const num = generateOrderNumber(now);
        const timePart = num.split('-')[1];
        expect(timePart).toBe(now.toString(36).toUpperCase());
    });

    it('генерирует разные номера при одном времени (случайный суффикс)', () => {
        const a = generateOrderNumber(1_700_000_000_000);
        const b = generateOrderNumber(1_700_000_000_000);
        expect(a).not.toBe(b);
    });
});
