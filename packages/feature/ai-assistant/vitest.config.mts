import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import { vitestPreset } from '../../../tools/vitest/preset.mjs';

const preset = vitestPreset(import.meta.dirname);

// Пакет на уровень глубже kit'ов: переопределяем резолвер путей, чтобы он
// нашёл корневой tsconfig.base.json (в пресете путь рассчитан на packages/<kit>).
export default defineConfig({
    ...preset,
    plugins: [
        tsconfigPaths({ root: import.meta.dirname, projects: ['../../../tsconfig.base.json'] }),
        ...preset.plugins.slice(1),
    ],
    test: {
        ...preset.test,
        coverage: {
            ...preset.test.coverage,
            // Декларативные модуль/процессор (регистрация очереди/делегирование) без логики.
            exclude: [
                ...preset.test.coverage.exclude,
                'src/**/ai-assistant.module.ts',
                'src/**/ai-jobs.processor.ts',
            ],
        },
    },
});
