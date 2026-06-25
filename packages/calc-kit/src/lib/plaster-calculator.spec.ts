import { describe, expect, it } from 'vitest';
import { PlasterCalculator } from './plaster-calculator';

const calc = new PlasterCalculator();

describe('PlasterCalculator', () => {
    it('известные значения: area=20 (дефолты thick=10, расход=1, bag=25, waste 5%)', () => {
        // kg=20*10*1*1.05=210; bags=ceil(210/25)=9
        const r = calc.calculate({ area: 20 });
        expect(r.quantity).toBe(210);
        expect(r.unit.ru).toBe('кг');
        expect(r.packages).toBe(9);
        expect(r.packageUnit.ru).toBe('мешок');
        expect(r.categorySlug).toBe('plaster');
    });

    it('граница: area=0 → 0 кг и 0 мешков', () => {
        const r = calc.calculate({ area: 0 });
        expect(r.quantity).toBe(0);
        expect(r.packages).toBe(0);
    });

    it('малая площадь → минимум 1 мешок (ceil)', () => {
        const r = calc.calculate({ area: 0.1 });
        expect(r.packages).toBe(1);
    });

    it('округление массы round2 (2 знака)', () => {
        const r = calc.calculate({ area: 3.33, layerThicknessMm: 1, wastePercent: 0 });
        // 3.33*1*1=3.33
        expect(r.quantity).toBe(3.33);
    });

    it('больше wastePercent → не меньше мешков', () => {
        const low = calc.calculate({ area: 20, wastePercent: 5 }).packages;
        const high = calc.calculate({ area: 20, wastePercent: 50 }).packages;
        expect(high).toBeGreaterThanOrEqual(low);
    });
});
