import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokens } from './tokens.generated';

const read = (rel: string) => readFileSync(resolve(import.meta.dirname, rel), 'utf8');
const requireCjs = createRequire(import.meta.url);
const preset = requireCjs('../tailwind-preset.cjs');

describe('design-tokens — единый источник истины', () => {
    it('tokens.css несёт цвета RGB-каналами из tokens.json', () => {
        const css = read('styles/tokens.css');
        expect(css).toContain('--color-brick-orange: 238 117 23;');
        expect(css).toContain('--radius-md: 16px;');
    });

    it('правка одного токена меняет и Tailwind, и Material (общий var)', () => {
        const css = read('styles/tokens.css');
        const material = read('styles/material-bridge.css');
        // accent → brick-orange (одна точка правки)
        expect(css).toContain('--color-accent: var(--color-brick-orange);');
        // Tailwind-пресет ссылается на тот же var
        expect(preset.theme.extend.colors.accent).toBe('rgb(var(--color-accent) / <alpha-value>)');
        // Material ссылается на тот же var
        expect(material).toContain('--mat-sys-primary: rgb(var(--color-accent));');
    });

    it('TS-экспорт токенов доступен (mobile/TS-консьюмеры)', () => {
        expect(tokens.color['brick-orange']).toBe('238 117 23');
        expect(tokens.radius.md).toBe('16px');
        expect(tokens.fontFamily.display).toContain('Poppins');
    });
});
