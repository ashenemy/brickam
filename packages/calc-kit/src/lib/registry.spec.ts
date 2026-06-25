import { describe, expect, it } from 'vitest';
import { CALCULATORS, getCalculator } from './registry';

describe('registry', () => {
    it('содержит все 7 калькуляторов', () => {
        expect(CALCULATORS).toHaveLength(7);
    });

    it('ключи и categorySlug совпадают с ожидаемыми', () => {
        const pairs = CALCULATORS.map((c) => [c.key, c.categorySlug]);
        expect(pairs).toEqual([
            ['paint', 'paint'],
            ['tile', 'tile'],
            ['flooring', 'flooring'],
            ['wallpaper', 'wallpaper'],
            ['concrete', 'concrete'],
            ['drywall', 'drywall'],
            ['plaster', 'plaster'],
        ]);
    });

    it('ключи уникальны', () => {
        const keys = CALCULATORS.map((c) => c.key);
        expect(new Set(keys).size).toBe(keys.length);
    });

    it('у каждого мультиязычное имя и непустые поля', () => {
        for (const c of CALCULATORS) {
            expect(c.name.hy).not.toBe('');
            expect(c.name.ru).not.toBe('');
            expect(c.name.en).not.toBe('');
            expect(c.fields.length).toBeGreaterThan(0);
        }
    });

    it('getCalculator находит по ключу', () => {
        expect(getCalculator('paint')?.key).toBe('paint');
        expect(getCalculator('plaster')?.categorySlug).toBe('plaster');
    });

    it('getCalculator возвращает undefined для неизвестного ключа', () => {
        expect(getCalculator('nope')).toBeUndefined();
    });
});
