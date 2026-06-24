import swc from 'unplugin-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import { vitestPreset } from '../../../tools/vitest/preset.mjs';

// feature-пакеты на 3 уровня глубже kit'ов, поэтому путь до tsconfig.base.json
// другой — переопределяем плагин tsconfigPaths корректным относительным путём.
const preset = vitestPreset(import.meta.dirname);

export default defineConfig({
    ...preset,
    plugins: [
        tsconfigPaths({
            root: import.meta.dirname,
            projects: ['../../../tsconfig.base.json'],
        }),
        swc.vite({
            jsc: {
                target: 'es2022',
                parser: { syntax: 'typescript', decorators: true },
                transform: { legacyDecorator: true, decoratorMetadata: true },
            },
        }),
    ],
});
