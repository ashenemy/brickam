import { describe, expect, it } from 'vitest';
import { WallpaperCalculator } from './wallpaper-calculator';

const calc = new WallpaperCalculator();

describe('WallpaperCalculator', () => {
    it('известные значения: 5x4 комната (дефолты)', () => {
        // perimeter=18; stripHeight=2.7; stripsPerRoll=floor(10.05/2.7)=3;
        // stripsNeeded=ceil(18/0.53)=34; rolls=ceil(34/3)=12
        const r = calc.calculate({ roomLength: 5, roomWidth: 4 });
        expect(r.quantity).toBe(12);
        expect(r.packages).toBe(12);
        expect(r.unit.ru).toBe('рулон');
        expect(r.categorySlug).toBe('wallpaper');
        expect(r.breakdown[0].value).toBe(34);
    });

    it('граница: нулевая комната → 0 рулонов', () => {
        const r = calc.calculate({ roomLength: 0, roomWidth: 0 });
        expect(r.quantity).toBe(0);
        expect(r.packages).toBe(0);
    });

    it('малая комната → минимум 1 рулон (ceil)', () => {
        // perimeter=2; stripsNeeded=ceil(2/0.53)=4; stripsPerRoll=3; rolls=ceil(4/3)=2
        const r = calc.calculate({ roomLength: 0.5, roomWidth: 0.5 });
        expect(r.packages).toBeGreaterThanOrEqual(1);
        expect(r.packages).toBe(2);
    });

    it('раппорт уменьшает полос в рулоне → не меньше рулонов', () => {
        const noRepeat = calc.calculate({ roomLength: 5, roomWidth: 4, patternRepeat: 0 }).quantity;
        const withRepeat = calc.calculate({
            roomLength: 5,
            roomWidth: 4,
            patternRepeat: 0.6,
        }).quantity;
        expect(withRepeat).toBeGreaterThanOrEqual(noRepeat);
    });

    it('stripsPerRoll не меньше 1 при очень высокой стене', () => {
        const r = calc.calculate({ roomLength: 3, roomWidth: 3, wallHeight: 100 });
        expect(r.quantity).toBeGreaterThan(0);
    });

    it('больше wastePercent → не меньше рулонов', () => {
        const low = calc.calculate({ roomLength: 5, roomWidth: 4, wastePercent: 0 }).quantity;
        const high = calc.calculate({ roomLength: 5, roomWidth: 4, wastePercent: 30 }).quantity;
        expect(high).toBeGreaterThanOrEqual(low);
    });
});
