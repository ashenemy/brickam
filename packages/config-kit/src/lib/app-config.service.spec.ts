import { describe, expect, it } from 'vitest';
import { AppConfigService } from './app-config.service';
import type { AppConfig } from './config-schema';

const sample = (): AppConfig => ({
    env: { nodeEnv: 'production' },
    server: { port: 3000, globalPrefix: 'api', corsOrigins: [], requestTimeoutMs: 30000 },
    auth: {
        otp: { length: 6, ttlSeconds: 300, maxAttempts: 5, resendCooldownSeconds: 60 },
        jwt: { accessTtl: '15m', refreshTtl: '30d', accessSecret: 's', refreshSecret: 'r' },
    },
    pagination: { defaultPageSize: 20, maxPageSize: 100 },
    marketplace: { baseCurrency: 'AMD', displayCurrencies: ['AMD'], commissionPercent: 7.5 },
    providers: {
        sms: 'mock',
        llm: 'anthropic',
        embeddings: 'voyage',
        image: 'fal',
        video: 'ffmpeg',
        storage: 's3',
        payment: 'mock',
        exchangeRates: 'cba',
    },
    features: { aiSearch: true, videoCover: true, wishlist: true, loyalty: true, botOnlySsr: true },
    queue: { redisUrl: 'redis://localhost' },
    database: { mongoUri: 'mongodb://localhost/db' },
    secrets: {},
});

describe('AppConfigService', () => {
    it('отдаёт неймспейсы через get() и геттеры', () => {
        const svc = new AppConfigService(sample());
        expect(svc.get('server').port).toBe(3000);
        expect(svc.marketplace.commissionPercent).toBe(7.5);
        expect(svc.providers.llm).toBe('anthropic');
        expect(svc.isProduction).toBe(true);
        expect(svc.isDevelopment).toBe(false);
    });

    it('all возвращает весь конфиг', () => {
        const svc = new AppConfigService(sample());
        expect(svc.all.database.mongoUri).toContain('mongodb://');
    });

    it('покрывает все типизированные геттеры неймспейсов', () => {
        const svc = new AppConfigService(sample());
        expect(svc.server.globalPrefix).toBe('api');
        expect(svc.auth.otp.length).toBe(6);
        expect(svc.pagination.maxPageSize).toBe(100);
        expect(svc.features.loyalty).toBe(true);
        expect(svc.database.mongoUri).toContain('mongodb://');
        expect(svc.queue.redisUrl).toContain('redis://');
        expect(svc.secrets).toEqual({});
    });

    it('isDevelopment истинно для dev-окружения', () => {
        const cfg = sample();
        cfg.env.nodeEnv = 'development';
        const svc = new AppConfigService(cfg);
        expect(svc.isDevelopment).toBe(true);
        expect(svc.isProduction).toBe(false);
    });
});
