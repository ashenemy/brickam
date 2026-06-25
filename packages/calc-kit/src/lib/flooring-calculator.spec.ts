import { describe, expect, it } from 'vitest';
import { FlooringCalculator } from './flooring-calculator';

const calc = new FlooringCalculator();

describe('FlooringCalculator', () => {
    it('известные значения: area=20 (дефолты packCoverage=2, waste 7%)', () => {
        // 20/2=10 *1.07=10.7 → ceil=11 упаковок
        const r = calc.calculate({ area: 20 });
        expect(r.quantity).toBe(11);
        expect(r.packages).toBe(11);
        expect(r.unit.ru).toBe('упаковка');
        expect(r.categorySlug).toBe('flooring');
    });

    it('граница: area=0 → 0 упаковок', () => {
        const r = calc.calculate({ area: 0 });
        expect(r.packages).toBe(0);
    });

    it('малая площадь → минимум 1 упаковка (ceil)', () => {
        const r = calc.calculate({ area: 0.5 });
        expect(r.packages).toBe(1);
    });

    it('округление ВВЕРХ при ровном делении без запаса', () => {
        const r = calc.calculate({ area: 8, packCoverage: 2, wastePercent: 0 });
        expect(r.packages).toBe(4);
    });

    it('больше wastePercent → не меньше упаковок', () => {
        const low = calc.calculate({ area: 20, wastePercent: 5 }).packages;
        const high = calc.calculate({ area: 20, wastePercent: 30 }).packages;
        expect(high).toBeGreaterThanOrEqual(low);
    });
});
