import type { BaseCalculator } from './base-calculator';
import { ConcreteScreedCalculator } from './concrete-screed-calculator';
import { DrywallCalculator } from './drywall-calculator';
import { FlooringCalculator } from './flooring-calculator';
import { PaintCalculator } from './paint-calculator';
import { PlasterCalculator } from './plaster-calculator';
import { TileCalculator } from './tile-calculator';
import { WallpaperCalculator } from './wallpaper-calculator';

/** Реестр всех доступных калькуляторов (для списка в UI и подбора по ключу). */
export const CALCULATORS: BaseCalculator[] = [
    new PaintCalculator(),
    new TileCalculator(),
    new FlooringCalculator(),
    new WallpaperCalculator(),
    new ConcreteScreedCalculator(),
    new DrywallCalculator(),
    new PlasterCalculator(),
];

/** Найти калькулятор по ключу (или undefined, если такого нет). */
export function getCalculator(key: string): BaseCalculator | undefined {
    return CALCULATORS.find((c) => c.key === key);
}
