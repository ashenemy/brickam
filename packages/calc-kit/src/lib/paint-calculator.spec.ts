import { describe, expect, it } from 'vitest';
import { PaintCalculator } from './paint-calculator';

const calc = new PaintCalculator();

describe('PaintCalculator', () => {
    it('известные значения: area=50 (дефолты)', () => {
        // 50*2/10=10 л; *1.05=10.5 л; банок ceil(10.5/2.5)=5
        const r = calc.calculate({ area: 50 });
        expect(r.quantity).toBe(10.5);
        expect(r.unit.ru).toBe('л');
        expect(r.packages).toBe(5);
        expect(r.packageUnit.ru).toBe('банка');
        expect(r.categorySlug).toBe('paint');
        expect(r.breakdown[0].value).toBe(10.5);
    });

    it('граница: area=0 → 0 литров и 0 банок', () => {
        const r = calc.calculate({ area: 0 });
        expect(r.quantity).toBe(0);
        expect(r.packages).toBe(0);
    });

    it('малая площадь → минимум 1 банка (ceil)', () => {
        const r = calc.calculate({ area: 1 });
        expect(r.packages).toBe(1);
    });

    it('округление ВВЕРХ до банки: дробные банки → следующее целое', () => {
        // area=60: 12 л *1.05=12.6 → ceil(12.6/2.5)=ceil(5.04)=6
        const r = calc.calculate({ area: 60 });
        expect(r.packages).toBe(6);
    });

    it('больше wastePercent → не меньше литров', () => {
        const low = calc.calculate({ area: 50, wastePercent: 5 }).quantity;
        const high = calc.calculate({ area: 50, wastePercent: 20 }).quantity;
        expect(high).toBeGreaterThanOrEqual(low);
    });

    it('переопределение полей: coats и packLiters', () => {
        // 50*3/10=15 *1.05=15.75; ceil(15.75/5)=4
        const r = calc.calculate({ area: 50, coats: 3, packLiters: 5 });
        expect(r.quantity).toBe(15.75);
        expect(r.packages).toBe(4);
    });

    it('поля формы доступны для UI', () => {
        expect(calc.fields.map((f) => f.key)).toEqual([
            'area',
            'coats',
            'coveragePerLiter',
            'wastePercent',
            'packLiters',
        ]);
        expect(calc.fields.every((f) => f.type === 'number')).toBe(true);
    });
});
