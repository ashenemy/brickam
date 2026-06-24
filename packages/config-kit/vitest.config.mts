import { defineConfig } from 'vitest/config';
import { vitestPreset } from '../../tools/vitest/preset.mjs';

export default defineConfig(vitestPreset(import.meta.dirname));
