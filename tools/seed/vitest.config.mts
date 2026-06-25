import { defineConfig } from 'vitest/config';
import { vitestPreset } from '../vitest/preset.mjs';

const preset = vitestPreset(import.meta.dirname);

/**
 * Vitest для tools/seed. Билдеры/раннер тестируются на InMemorySeedStore — без
 * реального Mongo. main.ts (CLI-обёртка) и mongo-store.ts (тонкая обёртка над
 * mongoose) исключены из покрытия как требующие подключения.
 */
export default defineConfig({
    ...preset,
    test: {
        ...preset.test,
        coverage: {
            ...preset.test.coverage,
            exclude: [
                ...preset.test.coverage.exclude,
                'src/main.ts',
                'src/mongo-store.ts',
                'src/index.ts',
            ],
        },
    },
});
