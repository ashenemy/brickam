import { BaseCalculator } from './base-calculator';
import { ceil } from './math.util';
import type { CalcField, CalcInput, CalcResult, LocalizedText } from './types';

/** Калькулятор обоев: число рулонов по периметру, высоте и раппорту. */
export class WallpaperCalculator extends BaseCalculator {
    readonly key = 'wallpaper';
    readonly name: LocalizedText = { hy: 'Պաստառ', ru: 'Обои', en: 'Wallpaper' };
    readonly categorySlug = 'wallpaper';
    readonly fields: CalcField[] = [
        {
            key: 'roomLength',
            type: 'number',
            label: { hy: 'Սենյակի երկարություն', ru: 'Длина комнаты', en: 'Room length' },
            unit: { hy: 'մ', ru: 'м', en: 'm' },
            min: 0,
        },
        {
            key: 'roomWidth',
            type: 'number',
            label: { hy: 'Սենյակի լայնություն', ru: 'Ширина комнаты', en: 'Room width' },
            unit: { hy: 'մ', ru: 'м', en: 'm' },
            min: 0,
        },
        {
            key: 'wallHeight',
            type: 'number',
            label: { hy: 'Պատի բարձրություն', ru: 'Высота стены', en: 'Wall height' },
            unit: { hy: 'մ', ru: 'м', en: 'm' },
            default: 2.7,
            min: 0,
        },
        {
            key: 'rollLength',
            type: 'number',
            label: { hy: 'Ռուլոնի երկարություն', ru: 'Длина рулона', en: 'Roll length' },
            unit: { hy: 'մ', ru: 'м', en: 'm' },
            default: 10.05,
            min: 0,
        },
        {
            key: 'rollWidth',
            type: 'number',
            label: { hy: 'Ռուլոնի լայնություն', ru: 'Ширина рулона', en: 'Roll width' },
            unit: { hy: 'մ', ru: 'м', en: 'm' },
            default: 0.53,
            min: 0,
        },
        {
            key: 'patternRepeat',
            type: 'number',
            label: { hy: 'Նախշի կրկնություն', ru: 'Раппорт рисунка', en: 'Pattern repeat' },
            unit: { hy: 'մ', ru: 'м', en: 'm' },
            default: 0,
            min: 0,
        },
        {
            key: 'wastePercent',
            type: 'number',
            label: { hy: 'Պահուստ', ru: 'Запас', en: 'Waste' },
            unit: { hy: '%', ru: '%', en: '%' },
            default: 0,
            min: 0,
        },
    ];

    calculate(input: CalcInput): CalcResult {
        const roomLength = this.field(input, 'roomLength', 0);
        const roomWidth = this.field(input, 'roomWidth', 0);
        const wallHeight = this.field(input, 'wallHeight', 2.7);
        const rollLength = this.field(input, 'rollLength', 10.05);
        const rollWidth = this.field(input, 'rollWidth', 0.53);
        const patternRepeat = this.field(input, 'patternRepeat', 0);
        const wastePercent = this.field(input, 'wastePercent', 0);

        const perimeter = 2 * (roomLength + roomWidth);
        const stripHeight = wallHeight + patternRepeat;
        const stripsPerRoll = Math.max(1, Math.floor(rollLength / stripHeight));
        const stripsNeeded = ceil((perimeter / rollWidth) * (1 + wastePercent / 100));
        const rolls = ceil(stripsNeeded / stripsPerRoll);
        const rollUnit: LocalizedText = { hy: 'ռուլոն', ru: 'рулон', en: 'roll' };

        return {
            quantity: rolls,
            unit: rollUnit,
            packages: rolls,
            packageUnit: rollUnit,
            categorySlug: this.categorySlug,
            breakdown: [
                {
                    label: { hy: 'Շերտեր', ru: 'Полосы', en: 'Strips' },
                    value: stripsNeeded,
                    unit: { hy: 'հատ', ru: 'шт', en: 'pcs' },
                },
            ],
        };
    }
}
