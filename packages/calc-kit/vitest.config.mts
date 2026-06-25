import { defineConfig } from 'vitest/config';
import { vitestPreset } from '../../tools/vitest/preset.mjs';

const preset = vitestPreset(import.meta.dirname);

// Покрываем тестами всю расчётную логику калькуляторов и math.util.
// types.ts — только декларации типов (нет исполняемого кода), исключаем.
export default defineConfig({
    ...preset,
    test: {
        ...preset.test,
        coverage: {
            ...preset.test.coverage,
            exclude: [...preset.test.coverage.exclude, 'src/lib/types.ts'],
        },
    },
});
