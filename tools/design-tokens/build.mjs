#!/usr/bin/env node
// Генерация из единственного источника истины packages/design-tokens/src/tokens.json:
//   - src/styles/tokens.css      (:root CSS-переменные; цвета — RGB-каналами)
//   - src/tokens.generated.ts    (типизированный TS-объект для mobile/TS-консьюмеров)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../packages/design-tokens');
const tokens = JSON.parse(readFileSync(resolve(root, 'src/tokens.json'), 'utf8'));

const lines = [];
const section = (title) => lines.push('', `    /* ---- ${title} ---- */`);

section('Цвета (RGB-каналы, для alpha в Tailwind: rgb(var(--color-x) / <alpha>))');
for (const [name, value] of Object.entries(tokens.color)) {
    lines.push(`    --color-${name}: ${value};`);
}
section('Семантические цвета (ссылаются на каналы выше)');
for (const [name, ref] of Object.entries(tokens.semanticColor)) {
    lines.push(`    --color-${name}: var(--color-${ref});`);
}
section('Линии и стекло (rgba)');
for (const [name, value] of Object.entries(tokens.line)) {
    lines.push(`    --${name}: ${value};`);
}
section('Отступы (сетка 8px)');
for (const [name, value] of Object.entries(tokens.space)) {
    lines.push(`    --space-${name}: ${value};`);
}
section('Скругления');
for (const [name, value] of Object.entries(tokens.radius)) {
    lines.push(`    --radius-${name}: ${value};`);
}
section('Типографика');
for (const [name, value] of Object.entries(tokens.fontFamily)) {
    lines.push(`    --font-${name}: ${value};`);
}
for (const [name, value] of Object.entries(tokens.fontWeight)) {
    lines.push(`    --fw-${name}: ${value};`);
}
for (const [name, value] of Object.entries(tokens.fontSize)) {
    lines.push(`    --fs-${name}: ${value};`);
}
section('Композитные роли типографики (font-shorthand)');
for (const [name, value] of Object.entries(tokens.typeRole)) {
    lines.push(`    --type-${name}: ${value};`);
}
section('Блюр');
for (const [name, value] of Object.entries(tokens.blur)) {
    lines.push(`    --blur-${name}: ${value};`);
}
section('Тени (неоморф-стекло)');
for (const [name, value] of Object.entries(tokens.shadow)) {
    lines.push(`    --shadow-${name}: ${value};`);
}
section('Движение');
for (const [name, value] of Object.entries(tokens.motion)) {
    lines.push(`    --${name}: ${value};`);
}
section('Лейаут');
for (const [name, value] of Object.entries(tokens.layout)) {
    lines.push(`    --${name}: ${value};`);
}

const css = `/* СГЕНЕРИРОВАНО tools/design-tokens/build.mjs из tokens.json. Не править вручную. */\n:root {${lines.join('\n')}\n}\n`;

mkdirSync(resolve(root, 'src/styles'), { recursive: true });
writeFileSync(resolve(root, 'src/styles/tokens.css'), css);

const ts = `/* СГЕНЕРИРОВАНО tools/design-tokens/build.mjs из tokens.json. Не править вручную. */\nexport const tokens = ${JSON.stringify(tokens, null, 4)} as const;\n\nexport type Tokens = typeof tokens;\n`;
writeFileSync(resolve(root, 'src/tokens.generated.ts'), ts);

console.log('✔ design-tokens: tokens.css + tokens.generated.ts сгенерированы');
