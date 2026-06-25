import { describe, expect, it } from 'vitest';
import { DrywallCalculator } from './drywall-calculator';

const calc = new DrywallCalculator();

describe('DrywallCalculator', () => {
    it('известные значения: area=10 (дефолты 2.5x1.2, waste 10%)', () => {
        // sheetArea=3; 10/3=3.333 *1.1=3.667 → ceil=4 листа
        const r = calc.calculate({ area: 10 });
        expect(r.quantity).toBe(4);
        expect(r.packages).toBe(4);
        expect(r.unit.ru).toBe('лист');
        expect(r.categorySlug).toBe('drywall');
    });

    it('граница: area=0 → 0 листов', () => {
        const r = calc.calculate({ area: 0 });
        expect(r.quantity).toBe(0);
        expect(r.packages).toBe(0);
    });

    it('малая площадь → минимум 1 лист (ceil)', () => {
        const r = calc.calculate({ area: 0.5 });
        expect(r.packages).toBe(1);
    });

    it('округление ВВЕРХ при ровном делении без запаса', () => {
        const r = calc.calculate({ area: 6, sheetLength: 2, sheetWidth: 1, wastePercent: 0 });
        // sheetArea=2; 6/2=3 ровно → 3 листа
        expect(r.quantity).toBe(3);
    });

    it('больше wastePercent → не меньше листов', () => {
        const low = calc.calculate({ area: 10, wastePercent: 5 }).quantity;
        const high = calc.calculate({ area: 10, wastePercent: 30 }).quantity;
        expect(high).toBeGreaterThanOrEqual(low);
    });
});
