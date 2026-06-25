import { BaseCalculator } from './base-calculator';
import { applyWaste, ceil } from './math.util';
import type { CalcField, CalcInput, CalcResult, LocalizedText } from './types';

/** Калькулятор гипсокартона: число листов по площади и размеру листа + запас. */
export class DrywallCalculator extends BaseCalculator {
    readonly key = 'drywall';
    readonly name: LocalizedText = { hy: 'Գիպսաստվար', ru: 'Гипсокартон', en: 'Drywall' };
    readonly categorySlug = 'drywall';
    readonly fields: CalcField[] = [
        {
            key: 'area',
            type: 'number',
            label: { hy: 'Մակերես', ru: 'Площадь', en: 'Area' },
            unit: { hy: 'մ²', ru: 'м²', en: 'm²' },
            min: 0,
        },
        {
            key: 'sheetLength',
            type: 'number',
            label: { hy: 'Թերթի երկարություն', ru: 'Длина листа', en: 'Sheet length' },
            unit: { hy: 'մ', ru: 'м', en: 'm' },
            default: 2.5,
            min: 0,
        },
        {
            key: 'sheetWidth',
            type: 'number',
            label: { hy: 'Թերթի լայնություն', ru: 'Ширина листа', en: 'Sheet width' },
            unit: { hy: 'մ', ru: 'м', en: 'm' },
            default: 1.2,
            min: 0,
        },
        {
            key: 'wastePercent',
            type: 'number',
            label: { hy: 'Պահուստ', ru: 'Запас', en: 'Waste' },
            unit: { hy: '%', ru: '%', en: '%' },
            default: 10,
            min: 0,
        },
    ];

    calculate(input: CalcInput): CalcResult {
        const area = this.field(input, 'area', 0);
        const sheetLength = this.field(input, 'sheetLength', 2.5);
        const sheetWidth = this.field(input, 'sheetWidth', 1.2);
        const wastePercent = this.field(input, 'wastePercent', 10);

        const sheetArea = sheetLength * sheetWidth;
        const sheets = ceil(applyWaste(area / sheetArea, wastePercent));
        const sheetUnit: LocalizedText = { hy: 'թերթ', ru: 'лист', en: 'sheet' };

        return {
            quantity: sheets,
            unit: sheetUnit,
            packages: sheets,
            packageUnit: sheetUnit,
            categorySlug: this.categorySlug,
            breakdown: [
                {
                    label: { hy: 'Գիպսաստվար', ru: 'Гипсокартон', en: 'Drywall' },
                    value: sheets,
                    unit: sheetUnit,
                },
            ],
        };
    }
}
