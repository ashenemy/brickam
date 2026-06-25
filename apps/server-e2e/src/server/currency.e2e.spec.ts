import { resolve } from 'node:path';
import { ConfigKitModule } from '@brickam/config-kit';
import {
    CurrencyController,
    CurrencyService,
    ExchangeRatesRepository,
    RatesProvider,
} from '@brickam/currency';
import { I18nKitModule } from '@brickam/i18n-kit';
import { ServerKitModule } from '@brickam/server-kit';
import { type INestApplication, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const STORED: Record<string, number> = { USD: 400, EUR: 420, RUB: 4 };

/** Провайдер «ЦБ недоступен»: всегда падает → сервис уходит в фолбэк на БД. */
@Injectable()
class DownProvider extends RatesProvider {
    readonly name = 'down';
    async fetchLatest(): Promise<Array<{ currency: string; rate: number }>> {
        throw new Error('CBA unavailable');
    }
}

/** Фейк репозитория: хранит последние курсы (фолбэк сервиса при сбое провайдера). */
@Injectable()
class FakeRatesRepo {
    async latestByCurrency(currency: string) {
        const rate = STORED[currency];
        return rate !== undefined
            ? { currency, rate, base: 'AMD', source: 'cba', fetchedAt: new Date() }
            : null;
    }
    async latestAll() {
        return Object.entries(STORED).map(([currency, rate]) => ({
            currency,
            rate,
            base: 'AMD',
            source: 'cba',
            fetchedAt: new Date(),
        }));
    }
    async create(data: Record<string, unknown>) {
        return data;
    }
}

@Module({
    controllers: [CurrencyController],
    providers: [
        CurrencyService,
        { provide: ExchangeRatesRepository, useClass: FakeRatesRepo },
        { provide: RatesProvider, useClass: DownProvider },
    ],
})
class CurrencyTestModule {}

const testEnv = {
    MONGO_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'e2e-access',
    JWT_REFRESH_SECRET: 'e2e-refresh',
};

describe('Currency e2e (фолбэк курсов; расчёты в AMD, конвертация — отображение)', () => {
    let app: INestApplication;
    let http: ReturnType<typeof request>;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                ConfigKitModule.forRoot({
                    env: testEnv,
                    configDir: resolve(import.meta.dirname, '../../../../config'),
                }),
                I18nKitModule,
                ServerKitModule.forRoot(),
                CurrencyTestModule,
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
        http = request(app.getHttpServer());
    });

    afterAll(async () => {
        await app?.close();
    });

    it('display-currencies: база AMD + список из конфига', async () => {
        const res = await http.get('/api/currency/display-currencies');
        expect(res.status).toBe(200);
        expect(res.body.data.base).toBe('AMD');
        expect(res.body.data.currencies).toContain('AMD');
        expect(res.body.data.currencies).toContain('USD');
    });

    it('rates: AMD имеет курс 1 (несмотря на сбой провайдера — фолбэк на БД)', async () => {
        const res = await http.get('/api/currency/rates');
        expect(res.status).toBe(200);
        const rates = res.body.data as Array<{ currency: string; rate: number }>;
        expect(rates.find((r) => r.currency === 'AMD')?.rate).toBe(1);
        // провайдер (CBA) недоступен → курс USD берётся из последнего сохранённого (БД)
        expect(rates.find((r) => r.currency === 'USD')?.rate).toBe(400);
    });

    it('convert: сумма AMD сохраняется, отдаётся отдельное значение отображения', async () => {
        const res = await http.get('/api/currency/convert?amount=40000&to=USD');
        expect(res.status).toBe(200);
        expect(res.body.data.amount).toBe(40000); // исходная сумма в AMD НЕ меняется
        expect(res.body.data.currency).toBe('USD');
        expect(res.body.data.converted).toBe(100); // 40000 / 400 — только для показа
    });

    it('convert в AMD — тождество (расчёты остаются в AMD)', async () => {
        const res = await http.get('/api/currency/convert?amount=40000&to=AMD');
        expect(res.status).toBe(200);
        expect(res.body.data.converted).toBe(40000);
    });
});
