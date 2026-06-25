import { describe, expect, it } from 'vitest';
import { ConcreteScreedCalculator } from './concrete-screed-calculator';

const calc = new ConcreteScreedCalculator();

describe('ConcreteScreedCalculator', () => {
    it('известные значения: area=20, thick=50 (дефолты)', () => {
        // volume=20*50/1000*1.05=1.05 м³; dryKg=1.05*1800=1890; bags=ceil(1890/25)=76
        const r = calc.calculate({ area: 20 });
        expect(r.quantity).toBe(1.05);
        expect(r.unit.ru).toBe('м³');
        expect(r.packages).toBe(76);
        expect(r.packageUnit.ru).toBe('мешок');
        expect(r.categorySlug).toBe('concrete');
        expect(r.breakdown[0].value).toBe(1.05); // объём
        expect(r.breakdown[1].value).toBe(1890); // сухая смесь, кг
    });

    it('граница: area=0 → 0 объёма и 0 мешков', () => {
        const r = calc.calculate({ area: 0 });
        expect(r.quantity).toBe(0);
        expect(r.packages).toBe(0);
    });

    it('малая площадь → минимум 1 мешок (ceil)', () => {
        const r = calc.calculate({ area: 0.1 });
        expect(r.packages).toBe(1);
    });

    it('округление объёма round2 (2 знака)', () => {
        const r = calc.calculate({ area: 7, thicknessMm: 33, wastePercent: 0 });
        // 7*33/1000=0.231 → 0.23
        expect(r.quantity).toBe(0.23);
    });

    it('больше wastePercent → не меньше мешков', () => {
        const low = calc.calculate({ area: 20, wastePercent: 5 }).packages;
        const high = calc.calculate({ area: 20, wastePercent: 25 }).packages;
        expect(high).toBeGreaterThanOrEqual(low);
    });
});
