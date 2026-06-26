#!/usr/bin/env node
// Блокирует коммит staged .env-файлов с плейсхолдерами change-me или строками,
// похожими на реальные секреты (AWS-ключи, приватные ключи, токены sk-/xox...).
// Шаблоны (.env.example/.sample/.template/.dist) пропускаются — плейсхолдеры в
// них легальны. Порт shell-версии на Node: устойчив к шеллу/кавычкам на Windows.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const SECRET_RE =
    /change-me|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(sk|rk)-[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}/i;
const TEMPLATE_RE = /\.(example|sample|template|dist)$/;

const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' })
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    // Только .env-файлы (имя начинается с .env), но не шаблоны.
    .filter((f) => basename(f).startsWith('.env') && !TEMPLATE_RE.test(f));

const hits = [];
for (const file of staged) {
    let content;
    try {
        content = readFileSync(file, 'utf8');
    } catch {
        continue; // удалённый/недоступный файл — пропускаем
    }
    content.split('\n').forEach((line, i) => {
        if (SECRET_RE.test(line)) hits.push(`${file}:${i + 1}: ${line.trim()}`);
    });
}

if (hits.length > 0) {
    console.error(
        'Коммит заблокирован: в staged .env найдены плейсхолдеры change-me или похожие на реальные секреты:',
    );
    for (const h of hits) console.error(`  ${h}`);
    console.error(
        'Уберите значения из .env (храните секреты в секрет-менеджере) либо не коммитьте .env.',
    );
    process.exit(1);
}
process.exit(0);
