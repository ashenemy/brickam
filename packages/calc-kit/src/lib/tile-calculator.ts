import { BaseCalculator } from './base-calculator';
import { applyWaste, ceil } from './math.util';
import type { CalcField, CalcInput, CalcResult, LocalizedText } from './types';

/** Калькулятор плитки: число плиток по площади и размеру одной + запас. */
export class TileCalculator extends BaseCalculator {
    readonly key = 'tile';
    readonly name: LocalizedText = { hy: 'Սալիկ', ru: 'Плитка', en: 'Tile' };
    readonly categorySlug = 'tile';
    readonly fields: CalcField[] = [
        {
            key: 'area',
            type: 'number',
            label: { hy: 'Մակերես', ru: 'Площадь', en: 'Area' },
            unit: { hy: 'մ²', ru: 'м²', en: 'm²' },
            min: 0,
        },
        {
            key: 'tileLength',
            type: 'number',
            label: { hy: 'Սալիկի երկարություն', ru: 'Длина плитки', en: 'Tile length' },
            unit: { hy: 'մ', ru: 'м', en: 'm' },
            default: 0.3,
            min: 0,
        },
        {
            key: 'tileWidth',
            type: 'number',
            label: { hy: 'Սալիկի լայնություն', ru: 'Ширина плитки', en: 'Tile width' },
            unit: { hy: 'մ', ru: 'м', en: 'm' },
            default: 0.3,
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
        {
            key: 'tilesPerPack',
            type: 'number',
            label: { hy: 'Սալիկ փաթեթում', ru: 'Плиток в упаковке', en: 'Tiles per pack' },
            default: 10,
            min: 1,
        },
    ];

    calculate(input: CalcInput): CalcResult {
        const area = this.field(input, 'area', 0);
        const tileLength = this.field(input, 'tileLength', 0.3);
        const tileWidth = this.field(input, 'tileWidth', 0.3);
        const wastePercent = this.field(input, 'wastePercent', 10);
        const tilesPerPack = this.field(input, 'tilesPerPack', 10);

        const tileArea = tileLength * tileWidth;
        const tiles = ceil(applyWaste(area / tileArea, wastePercent));
        const pcsUnit: LocalizedText = { hy: 'հատ', ru: 'шт', en: 'pcs' };

        return {
            quantity: tiles,
            unit: pcsUnit,
            packages: ceil(tiles / tilesPerPack),
            packageUnit: { hy: 'փաթեթ', ru: 'упаковка', en: 'pack' },
            categorySlug: this.categorySlug,
            breakdown: [
                {
                    label: { hy: 'Սալիկ', ru: 'Плитка', en: 'Tile' },
                    value: tiles,
                    unit: pcsUnit,
                },
            ],
        };
    }
}
