import type { AppConfigService } from '@brickam/config-kit';
import { ServiceUnavailableException } from '@brickam/core-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CurrencyService } from './currency.service';
import type { ExchangeRatesRepository } from './exchange-rates.repository';
import type { RatesProvider } from './rates-provider';

const makeConfig = (displayCurrencies: string[] = ['AMD', 'USD', 'EUR', 'RUB']): AppConfigService =>
    ({
        marketplace: { baseCurrency: 'AMD', displayCurrencies },
    }) as unknown as AppConfigService;

describe('CurrencyService', () => {
    let repo: {
        create: ReturnType<typeof vi.fn>;
        latestByCurrency: ReturnType<typeof vi.fn>;
        latestAll: ReturnType<typeof vi.fn>;
    };
    let provider: { name: string; fetchLatest: ReturnType<typeof vi.fn> };
    let service: CurrencyService;

    const build = (config: AppConfigService = makeConfig()): CurrencyService =>
        new CurrencyService(
            repo as unknown as ExchangeRatesRepository,
            provider as unknown as RatesProvider,
            config,
        );

    beforeEach(() => {
        repo = { create: vi.fn(), latestByCurrency: vi.fn(), latestAll: vi.fn() };
        provider = { name: 'cba', fetchLatest: vi.fn() };
        service = build();
    });

    describe('convert', () => {
        it('AMD → возвращает сумму без изменений', async () => {
            await expect(service.convert(1000, 'AMD')).resolves.toBe(1000);
            expect(provider.fetchLatest).not.toHaveBeenCalled();
        });

        it('USD при rate=400 → amountAmd/400 с round2', async () => {
            repo.latestByCurrency.mockResolvedValue({ rate: 400, fetchedAt: new Date() });

            // 1000 / 400 = 2.5
            await expect(service.convert(1000, 'USD')).resolves.toBe(2.5);
            // 1234 / 400 = 3.085 → round2 → 3.09
            await expect(service.convert(1234, 'USD')).resolves.toBe(3.09);
        });

        it('граничный 0 → 0 для любой валюты', async () => {
            repo.latestByCurrency.mockResolvedValue({ rate: 400, fetchedAt: new Date() });
            await expect(service.convert(0, 'AMD')).resolves.toBe(0);
            await expect(service.convert(0, 'USD')).resolves.toBe(0);
        });

        it('чистая: не мутирует исходную AMD-сумму', async () => {
            repo.latestByCurrency.mockResolvedValue({ rate: 390, fetchedAt: new Date() });
            const amountAmd = 39000;
            const converted = await service.convert(amountAmd, 'USD');
            expect(converted).toBe(100);
            // исходная сумма AMD неизменна — расчёты заказа в AMD не затронуты
            expect(amountAmd).toBe(39000);
        });
    });

    describe('getRate', () => {
        it('AMD → 1 без обращения к репозиторию/провайдеру', async () => {
            await expect(service.getRate('AMD')).resolves.toBe(1);
            expect(repo.latestByCurrency).not.toHaveBeenCalled();
        });

        it('берёт из БД (latestByCurrency) и кеширует для повторных вызовов', async () => {
            repo.latestByCurrency.mockResolvedValue({ rate: 400, fetchedAt: new Date() });

            await expect(service.getRate('USD')).resolves.toBe(400);
            await expect(service.getRate('USD')).resolves.toBe(400);

            // второй вызов взят из кеша — БД дёрнута один раз
            expect(repo.latestByCurrency).toHaveBeenCalledTimes(1);
        });

        it('фолбэк на зашитый курс, когда в БД пусто', async () => {
            repo.latestByCurrency.mockResolvedValue(null);

            // USD зашит в FallbackRatesProvider (≈390)
            await expect(service.getRate('USD')).resolves.toBe(390);
        });

        it('ServiceUnavailable, когда нет ни БД, ни зашитого курса', async () => {
            repo.latestByCurrency.mockResolvedValue(null);

            await expect(service.getRate('GBP')).rejects.toBeInstanceOf(
                ServiceUnavailableException,
            );
        });
    });

    describe('refresh', () => {
        it('успех провайдера → сохраняет в БД и наполняет кеш', async () => {
            provider.fetchLatest.mockResolvedValue([
                { currency: 'USD', rate: 390 },
                { currency: 'EUR', rate: 420 },
                { currency: 'RUB', rate: 4.2 },
            ]);

            await service.refresh();

            // провайдер вызван только для иностранных валют (без AMD)
            expect(provider.fetchLatest).toHaveBeenCalledWith(['USD', 'EUR', 'RUB']);
            expect(repo.create).toHaveBeenCalledTimes(3);
            expect(repo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    base: 'AMD',
                    currency: 'USD',
                    rate: 390,
                    source: 'cba',
                }),
            );

            // после refresh курс берётся из кеша — без обращения к БД
            await expect(service.getRate('USD')).resolves.toBe(390);
            expect(repo.latestByCurrency).not.toHaveBeenCalled();
        });

        it('ошибка провайдера → НЕ падает, остаётся последний сохранённый курс', async () => {
            // первый успешный refresh кладёт курс в кеш
            provider.fetchLatest.mockResolvedValueOnce([{ currency: 'USD', rate: 400 }]);
            // повторный provider бросает (сеть недоступна)
            provider.fetchLatest.mockRejectedValueOnce(new Error('network down'));

            await service.refresh();
            await expect(service.refresh()).resolves.toBeUndefined();

            // курс остался прежним (фолбэк на последний сохранённый), repo.create не дёрнут повторно
            await expect(service.getRate('USD')).resolves.toBe(400);
            expect(repo.create).toHaveBeenCalledTimes(1);
        });

        it('без иностранных валют (только AMD) — провайдер не вызывается', async () => {
            service = build(makeConfig(['AMD']));
            await service.refresh();
            expect(provider.fetchLatest).not.toHaveBeenCalled();
        });
    });

    describe('getRates', () => {
        it('AMD=1, остальные с актуальным курсом', async () => {
            provider.fetchLatest.mockResolvedValue([
                { currency: 'USD', rate: 390 },
                { currency: 'EUR', rate: 420 },
                { currency: 'RUB', rate: 4.2 },
            ]);
            await service.refresh();

            const rates = await service.getRates();

            const amd = rates.find((r) => r.currency === 'AMD');
            const usd = rates.find((r) => r.currency === 'USD');
            expect(amd?.rate).toBe(1);
            expect(usd?.rate).toBe(390);
            expect(rates).toHaveLength(4);
        });
    });

    describe('displayCurrencies / baseCurrency', () => {
        it('возвращают значения из конфига', () => {
            expect(service.baseCurrency).toBe('AMD');
            expect(service.displayCurrencies()).toEqual(['AMD', 'USD', 'EUR', 'RUB']);
        });
    });

    describe('onModuleInit / dailyRefresh', () => {
        it('onModuleInit делает первичный refresh и не падает при ошибке', async () => {
            provider.fetchLatest.mockRejectedValue(new Error('boom'));
            await expect(service.onModuleInit()).resolves.toBeUndefined();
        });

        it('dailyRefresh зовёт refresh', async () => {
            provider.fetchLatest.mockResolvedValue([{ currency: 'USD', rate: 400 }]);
            await service.dailyRefresh();
            expect(provider.fetchLatest).toHaveBeenCalled();
        });
    });
});
