import { describe, expect, it } from 'vitest';
import { TileCalculator } from './tile-calculator';

const calc = new TileCalculator();

describe('TileCalculator', () => {
    it('известные значения: area=10 (дефолты 0.3x0.3, waste 10%, 10/пак)', () => {
        // tileArea=0.09; 10/0.09=111.11 *1.1=122.22 → ceil=123 шт
        const r = calc.calculate({ area: 10 });
        expect(r.quantity).toBe(123);
        expect(r.unit.ru).toBe('шт');
        // ceil(123/10)=13 упаковок
        expect(r.packages).toBe(13);
        expect(r.packageUnit.ru).toBe('упаковка');
        expect(r.categorySlug).toBe('tile');
    });

    it('граница: area=0 → 0 плиток и 0 упаковок', () => {
        const r = calc.calculate({ area: 0 });
        expect(r.quantity).toBe(0);
        expect(r.packages).toBe(0);
    });

    it('малая площадь → минимум 1 упаковка (ceil)', () => {
        const r = calc.calculate({ area: 0.1 });
        expect(r.packages).toBe(1);
    });

    it('округление ВВЕРХ: плитки и упаковки — целые', () => {
        const r = calc.calculate({ area: 1, tileLength: 0.5, tileWidth: 0.5, wastePercent: 0 });
        // tileArea=0.25; 1/0.25=4 ровно → 4 шт; ceil(4/10)=1
        expect(r.quantity).toBe(4);
        expect(r.packages).toBe(1);
    });

    it('больше wastePercent → не меньше плиток', () => {
        const low = calc.calculate({ area: 10, wastePercent: 5 }).quantity;
        const high = calc.calculate({ area: 10, wastePercent: 15 }).quantity;
        expect(high).toBeGreaterThanOrEqual(low);
    });
});
