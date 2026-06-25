import { BaseCalculator } from './base-calculator';
import { applyWaste, ceil, round2 } from './math.util';
import type { CalcField, CalcInput, CalcResult, LocalizedText } from './types';

/** Калькулятор штукатурки: масса кг по площади/толщине/расходу и число мешков. */
export class PlasterCalculator extends BaseCalculator {
    readonly key = 'plaster';
    readonly name: LocalizedText = { hy: 'Սվաղ', ru: 'Штукатурка', en: 'Plaster' };
    readonly categorySlug = 'plaster';
    readonly fields: CalcField[] = [
        {
            key: 'area',
            type: 'number',
            label: { hy: 'Մակերես', ru: 'Площадь', en: 'Area' },
            unit: { hy: 'մ²', ru: 'м²', en: 'm²' },
            min: 0,
        },
        {
            key: 'layerThicknessMm',
            type: 'number',
            label: { hy: 'Շերտի հաստություն', ru: 'Толщина слоя', en: 'Layer thickness' },
            unit: { hy: 'մմ', ru: 'мм', en: 'mm' },
            default: 10,
            min: 0,
        },
        {
            key: 'consumptionKgPerM2PerMm',
            type: 'number',
            label: { hy: 'Ծախս 1 մ²/մմ', ru: 'Расход на м²/мм', en: 'Consumption per m²/mm' },
            unit: { hy: 'կգ', ru: 'кг', en: 'kg' },
            default: 1,
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
        const layerThicknessMm = this.field(input, 'layerThicknessMm', 10);
        const consumptionKgPerM2PerMm = this.field(input, 'consumptionKgPerM2PerMm', 1);
        const bagWeightKg = this.field(input, 'bagWeightKg', 25);
        const wastePercent = this.field(input, 'wastePercent', 5);

        const kg = applyWaste(area * layerThicknessMm * consumptionKgPerM2PerMm, wastePercent);
        const bags = ceil(kg / bagWeightKg);
        const kgUnit: LocalizedText = { hy: 'կգ', ru: 'кг', en: 'kg' };

        return {
            quantity: round2(kg),
            unit: kgUnit,
            packages: bags,
            packageUnit: { hy: 'պարկ', ru: 'мешок', en: 'bag' },
            categorySlug: this.categorySlug,
            breakdown: [
                {
                    label: { hy: 'Սվաղ', ru: 'Штукатурка', en: 'Plaster' },
                    value: round2(kg),
                    unit: kgUnit,
                },
            ],
        };
    }
}
