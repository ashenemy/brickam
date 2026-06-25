import { BaseCalculator } from './base-calculator';
import { applyWaste, ceil, round2 } from './math.util';
import type { CalcField, CalcInput, CalcResult, LocalizedText } from './types';

/** Калькулятор бетонной стяжки: объём м³ и число мешков сухой смеси. */
export class ConcreteScreedCalculator extends BaseCalculator {
    readonly key = 'concrete';
    readonly name: LocalizedText = {
        hy: 'Բետոնե հարթեցում',
        ru: 'Бетонная стяжка',
        en: 'Concrete screed',
    };
    readonly categorySlug = 'concrete';
    readonly fields: CalcField[] = [
        {
            key: 'area',
            type: 'number',
            label: { hy: 'Մակերես', ru: 'Площадь', en: 'Area' },
            unit: { hy: 'մ²', ru: 'м²', en: 'm²' },
            min: 0,
        },
        {
            key: 'thicknessMm',
            type: 'number',
            label: { hy: 'Հաստություն', ru: 'Толщина', en: 'Thickness' },
            unit: { hy: 'մմ', ru: 'мм', en: 'mm' },
            default: 50,
            min: 0,
        },
        {
            key: 'dryMixPerM3Kg',
            type: 'number',
            label: { hy: 'Չոր խառնուրդ 1 մ³-ում', ru: 'Сухой смеси на м³', en: 'Dry mix per m³' },
            unit: { hy: 'կգ', ru: 'кг', en: 'kg' },
            default: 1800,
            min: 0,
        },
        {
            key: 'bagWeightKg',
            type: 'number',
            label: { hy: 'Պարկի քաշ', ru: 'Вес мешка', en: 'Bag weight' },
            unit: { hy: 'կգ', ru: 'кг', en: 'kg' },
            default: 25,
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
    ];

    calculate(input: CalcInput): CalcResult {
        const area = this.field(input, 'area', 0);
        const thicknessMm = this.field(input, 'thicknessMm', 50);
        const dryMixPerM3Kg = this.field(input, 'dryMixPerM3Kg', 1800);
        const bagWeightKg = this.field(input, 'bagWeightKg', 25);
        const wastePercent = this.field(input, 'wastePercent', 5);

        const volume = applyWaste((area * thicknessMm) / 1000, wastePercent);
        const dryKg = volume * dryMixPerM3Kg;
        const bags = ceil(dryKg / bagWeightKg);

        const m3Unit: LocalizedText = { hy: 'մ³', ru: 'м³', en: 'm³' };
        const kgUnit: LocalizedText = { hy: 'կգ', ru: 'кг', en: 'kg' };

        return {
            quantity: round2(volume),
            unit: m3Unit,
            packages: bags,
            packageUnit: { hy: 'պարկ', ru: 'мешок', en: 'bag' },
            categorySlug: this.categorySlug,
            breakdown: [
                {
                    label: { hy: 'Ծավալ', ru: 'Объём', en: 'Volume' },
                    value: round2(volume),
                    unit: m3Unit,
                },
                {
                    label: { hy: 'Չոր խառնուրդ', ru: 'Сухая смесь', en: 'Dry mix' },
                    value: round2(dryKg),
                    unit: kgUnit,
                },
            ],
        };
    }
}
