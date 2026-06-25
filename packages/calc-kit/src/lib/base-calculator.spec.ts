import { describe, expect, it } from 'vitest';
import { PaintCalculator } from './paint-calculator';

// Проверяем общую логику BaseCalculator через конкретный PaintCalculator.
const calc = new PaintCalculator();

describe('BaseCalculator.field (через PaintCalculator)', () => {
    it('берёт значение из input, если оно задано', () => {
        // coveragePerLiter переопределён → влияет на литры
        const r = calc.calculate({ area: 50, coveragePerLiter: 5 });
        // 50*2/5=20 *1.05=21
        expect(r.quantity).toBe(21);
    });

    it('подставляет default поля, если в input нет', () => {
        // coats не задан → default 2
        const r = calc.calculate({ area: 50 });
        expect(r.quantity).toBe(10.5);
    });

    it('у поля без default используется fallback (area=0)', () => {
        // area не задана → нет default → fallback 0 → 0 литров
        const r = calc.calculate({});
        expect(r.quantity).toBe(0);
    });
});
