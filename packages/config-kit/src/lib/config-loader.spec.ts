import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ConfigValidationError, loadConfig } from './config-loader';

const DEFAULT_TOML = `
[server]
port = 3000
globalPrefix = "api"
corsOrigins = ["http://localhost:4200"]
requestTimeoutMs = 30000

[auth.otp]
length = 6
ttlSeconds = 300
maxAttempts = 5
resendCooldownSeconds = 60

[auth.jwt]
accessTtl = "15m"
refreshTtl = "30d"

[pagination]
defaultPageSize = 20
maxPageSize = 100

[marketplace]
baseCurrency = "AMD"
displayCurrencies = ["AMD", "USD"]
commissionPercent = 7.5

[providers]
sms = "mock"
llm = "anthropic"
embeddings = "voyage"
image = "fal"
video = "ffmpeg"
storage = "s3"
payment = "mock"
exchangeRates = "cba"

[features]
aiSearch = true
videoCover = true
wishlist = true
loyalty = true
botOnlySsr = true

[ai]
cacheTtlSeconds = 300
maxThemes = 6
throttlePerMinute = 60

[queue]
redisUrl = "env:REDIS_URL"
`;

const PROD_TOML = `
[providers]
sms = "twilio"
payment = "idram"
`;

let dir: string;

const fullEnv = (): NodeJS.ProcessEnv => ({
    MONGO_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'a-secret',
    JWT_REFRESH_SECRET: 'r-secret',
});

beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'cfg-'));
    writeFileSync(join(dir, 'default.toml'), DEFAULT_TOML);
    writeFileSync(join(dir, 'production.toml'), PROD_TOML);
});

afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
});

describe('loadConfig', () => {
    it('грузит и валидирует конфиг, резолвит env-плейсхолдеры и секреты', () => {
        const config = loadConfig({ configDir: dir, nodeEnv: 'development', env: fullEnv() });
        expect(config.server.port).toBe(3000);
        expect(config.marketplace.commissionPercent).toBe(7.5);
        // env:REDIS_URL → значение из окружения
        expect(config.queue.redisUrl).toBe('redis://localhost:6379');
        // секрет из env, не из TOML
        expect(config.auth.jwt.accessSecret).toBe('a-secret');
        expect(config.database.mongoUri).toBe('mongodb://localhost:27017/test');
        expect(config.env.nodeEnv).toBe('development');
    });

    it('применяет overlay по NODE_ENV (production переопределяет провайдеров)', () => {
        const config = loadConfig({ configDir: dir, nodeEnv: 'production', env: fullEnv() });
        expect(config.providers.sms).toBe('twilio');
        expect(config.providers.payment).toBe('idram');
        // незатронутое значение остаётся из default
        expect(config.providers.llm).toBe('anthropic');
    });

    it('падает (fail-fast) при отсутствии обязательного MONGO_URI', () => {
        const env = fullEnv();
        delete env.MONGO_URI;
        expect(() => loadConfig({ configDir: dir, nodeEnv: 'development', env })).toThrowError(
            ConfigValidationError,
        );
    });

    it('падает при отсутствии JWT-секретов', () => {
        const env = fullEnv();
        delete env.JWT_ACCESS_SECRET;
        try {
            loadConfig({ configDir: dir, nodeEnv: 'development', env });
            expect.unreachable('должно было упасть');
        } catch (error) {
            expect(error).toBeInstanceOf(ConfigValidationError);
            expect((error as ConfigValidationError).issues.join()).toContain('accessSecret');
        }
    });

    it('падает при некорректном типе (commissionPercent вне диапазона)', () => {
        const badDir = mkdtempSync(join(tmpdir(), 'cfg-bad-'));
        writeFileSync(
            join(badDir, 'default.toml'),
            DEFAULT_TOML.replace('commissionPercent = 7.5', 'commissionPercent = 250'),
        );
        expect(() =>
            loadConfig({ configDir: badDir, nodeEnv: 'development', env: fullEnv() }),
        ).toThrow(ConfigValidationError);
        rmSync(badDir, { recursive: true, force: true });
    });
});
