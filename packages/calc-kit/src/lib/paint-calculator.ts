import { BaseCalculator } from './base-calculator';
import { applyWaste, ceil, round2 } from './math.util';
import type { CalcField, CalcInput, CalcResult, LocalizedText } from './types';

/** Калькулятор краски: литры по площади, слоям и укрывистости + запас. */
export class PaintCalculator extends BaseCalculator {
    readonly key = 'paint';
    readonly name: LocalizedText = { hy: 'Ներկ', ru: 'Краска', en: 'Paint' };
    readonly categorySlug = 'paint';
    readonly fields: CalcField[] = [
        {
            key: 'area',
            type: 'number',
            label: { hy: 'Մակերես', ru: 'Площадь', en: 'Area' },
            unit: { hy: 'մ²', ru: 'м²', en: 'm²' },
            min: 0,
        },
        {
            key: 'coats',
            type: 'number',
            label: { hy: 'Շերտեր', ru: 'Слоёв', en: 'Coats' },
            default: 2,
            min: 1,
        },
        {
            key: 'coveragePerLiter',
            type: 'number',
            label: { hy: 'Ծածկույթ 1 լ-ով', ru: 'Расход на литр', en: 'Coverage per liter' },
            unit: { hy: 'մ²/լ', ru: 'м²/л', en: 'm²/L' },
            default: 10,
            min: 0,
        },
        {
            key: 'wastePercent',
            type: 'number',
            label: { hy: 'Պահուստ', ru: 'Запас', en: 'Waste' },
            unit: { hy: '%', ru: '%', en: '%' },
            default: 5,
            min: 0,
        },
        {
            key: 'packLiters',
            type: 'number',
            label: { hy: 'Բանկայի ծավալ', ru: 'Объём банки', en: 'Can volume' },
            unit: { hy: 'լ', ru: 'л', en: 'L' },
            default: 2.5,
            min: 0,
        },
    ];

    calculate(input: CalcInput): CalcResult {
        const area = this.field(input, 'area', 0);
        const coats = this.field(input, 'coats', 2);
        const coveragePerLiter = this.field(input, 'coveragePerLiter', 10);
        const wastePercent = this.field(input, 'wastePercent', 5);
        const packLiters = this.field(input, 'packLiters', 2.5);

        const liters = applyWaste((area * coats) / coveragePerLiter, wastePercent);
        const litersUnit: LocalizedText = { hy: 'լ', ru: 'л', en: 'L' };

        return {
            quantity: round2(liters),
            unit: litersUnit,
            packages: ceil(liters / packLiters),
            packageUnit: { hy: 'բանկա', ru: 'банка', en: 'can' },
            categorySlug: this.categorySlug,
            breakdown: [
                {
                    label: { hy: 'Ներկ', ru: 'Краска', en: 'Paint' },
                    value: round2(liters),
                    unit: litersUnit,
                },
            ],
        };
    }
}
