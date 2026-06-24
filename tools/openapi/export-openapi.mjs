#!/usr/bin/env node
// Экспортирует OpenAPI-спеку сервера в packages/api-kit/openapi.json.
// Использует собранный бандл в preview-режиме (без подключения к Mongo).
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const MAIN = 'dist/apps/server/main.js';

if (!existsSync(MAIN)) {
    console.log('Сборка сервера (nx build server)…');
    const build = spawnSync('npx', ['nx', 'build', 'server'], { stdio: 'inherit', shell: true });
    if (build.status !== 0) {
        process.exit(build.status ?? 1);
    }
}

// Плейсхолдеры только для прохождения валидации конфига при генерации (не секреты).
const env = {
    ...process.env,
    OPENAPI_EXPORT: '1',
    NODE_ENV: process.env.NODE_ENV ?? 'development',
    MONGO_URI: process.env.MONGO_URI ?? 'mongodb://localhost:27017/buildhub',
    REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'openapi-gen',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'openapi-gen',
};

const run = spawnSync('node', [MAIN], { stdio: 'inherit', env });
process.exit(run.status ?? 1);
