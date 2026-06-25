import { BaseCalculator } from './base-calculator';
import { applyWaste, ceil } from './math.util';
import type { CalcField, CalcInput, CalcResult, LocalizedText } from './types';

/** Калькулятор напольного покрытия: число упаковок по площади + запас. */
export class FlooringCalculator extends BaseCalculator {
    readonly key = 'flooring';
    readonly name: LocalizedText = { hy: 'Հատակածածկ', ru: 'Напольное покрытие', en: 'Flooring' };
    readonly categorySlug = 'flooring';
    readonly fields: CalcField[] = [
        {
            key: 'area',
            type: 'number',
            label: { hy: 'Մակերես', ru: 'Площадь', en: 'Area' },
            unit: { hy: 'մ²', ru: 'м²', en: 'm²' },
            min: 0,
        },
        {
            key: 'packCoverage',
            type: 'number',
            label: { hy: 'Փաթեթի ծածկույթ', ru: 'Покрытие упаковки', en: 'Pack coverage' },
            unit: { hy: 'մ²', ru: 'м²', en: 'm²' },
            default: 2,
            min: 0,
        },
        {
            key: 'wastePercent',
            type: 'number',
            label: { hy: 'Պահուստ', ru: 'Запас', en: 'Waste' },
            unit: { hy: '%', ru: '%', en: '%' },
            default: 7,
            min: 0,
        },
    ];

    calculate(input: CalcInput): CalcResult {
        const area = this.field(input, 'area', 0);
        const packCoverage = this.field(input, 'packCoverage', 2);
        const wastePercent = this.field(input, 'wastePercent', 7);

        const packs = ceil(applyWaste(area / packCoverage, wastePercent));
        const packUnit: LocalizedText = { hy: 'փաթեթ', ru: 'упаковка', en: 'pack' };

        return {
            quantity: packs,
            unit: packUnit,
            packages: packs,
            packageUnit: packUnit,
            categorySlug: this.categorySlug,
            breakdown: [
                {
                    label: { hy: 'Հատակածածկ', ru: 'Покрытие', en: 'Flooring' },
                    value: packs,
                    unit: packUnit,
                },
            ],
        };
    }
}
