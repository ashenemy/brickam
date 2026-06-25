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
});
