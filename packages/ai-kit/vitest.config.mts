import { defineConfig } from 'vitest/config';
import { vitestPreset } from '../../tools/vitest/preset.mjs';

const preset = vitestPreset(import.meta.dirname);

// Пороги покрытия — на ЛОГИКУ (моки/util). Сетевые провайдеры (anthropic/voyage)
// и DI-модуль ходят во внешний мир и в юнитах не покрываются — исключаем.
export default defineConfig({
    ...preset,
    test: {
        ...preset.test,
        coverage: {
            ...preset.test.coverage,
            exclude: [
                ...preset.test.coverage.exclude,
                'src/lib/anthropic-llm.provider.ts',
                'src/lib/voyage-embedding.provider.ts',
                'src/lib/ai-kit.module.ts',
                'src/index.ts',
            ],
        },
    },
});
