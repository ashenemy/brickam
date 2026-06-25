import { defineConfig } from 'vitest/config';
import { vitestPreset } from '../../tools/vitest/preset.mjs';

const preset = vitestPreset(import.meta.dirname);

// Сервер пока покрыт тестами только в модуле health (liveness/readiness).
// Переопределяем coverage.include пресета, чтобы пороги считались по реально
// тестируемому коду (redis.health + health.controller), а не по всему
// приложению (main.ts, observability и т.п., которые вне скоупа задачи).
// health.service существовал до задачи и в контроллере замокан — исключаем.
preset.test.coverage.include = ['src/app/health/**/*.ts'];
preset.test.coverage.exclude = [
    ...preset.test.coverage.exclude,
    'src/app/health/health.service.ts',
];

export default defineConfig(preset);
