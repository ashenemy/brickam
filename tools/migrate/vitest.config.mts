import { defineConfig } from 'vitest/config';
import { vitestPreset } from '../vitest/preset.mjs';

const preset = vitestPreset(import.meta.dirname);

/**
 * Vitest для tools/migrate. Раннер и спеки индексов тестируются на
 * InMemoryMigrationDb — без реального Mongo. main.ts (CLI-обёртка) и
 * MongoMigrationDb (тонкая обёртка над mongoose) исключены из покрытия как
 * требующие подключения.
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
                'src/mongo-db.ts',
                'src/index.ts',
            ],
        },
    },
});
