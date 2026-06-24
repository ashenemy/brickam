#!/usr/bin/env node
// Отклоняет коммит, если staged-файлы принадлежат более чем одному проекту Nx.
// Проект определяется ближайшим родительским каталогом с project.json.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' })
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

if (staged.length === 0) process.exit(0);

const findProjectRoot = (file) => {
    let dir = dirname(file);
    while (dir && dir !== '.' && dir !== '/') {
        if (existsSync(join(dir, 'project.json'))) return dir;
        dir = dirname(dir);
    }
    return null; // корневые/служебные файлы — вне проектов
};

const projects = new Set();
const rootless = [];
for (const file of staged) {
    const root = findProjectRoot(file);
    if (root) projects.add(root);
    else rootless.push(file);
}

if (projects.size > 1) {
    console.error('\n✖ Коммит затрагивает несколько проектов Nx:');
    for (const p of projects) console.error('   - ' + p);
    console.error('Правило: один коммит = один app/package. Раздели изменения.\n');
    process.exit(1);
}

// Разрешаем: ровно один проект; либо только корневые конфиги (chore/root).
process.exit(0);
