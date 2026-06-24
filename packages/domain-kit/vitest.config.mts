import { defineConfig } from 'vitest/config';
import { vitestPreset } from '../../tools/vitest/preset.mjs';

const preset = vitestPreset(import.meta.dirname);

// Пороги покрытия — на ЛОГИКУ (money/order-calc). Контракты (абстрактные классы),
// enum'ы статусов и каталоги прав — декларативны, исключаем из coverage.
export default defineConfig({
    ...preset,
    test: {
        ...preset.test,
        coverage: {
            ...preset.test.coverage,
            exclude: [
                ...preset.test.coverage.exclude,
                'src/**/*.contract.ts',
                'src/lib/roles.ts',
                'src/lib/order-status.ts',
            ],
        },
    },
});
