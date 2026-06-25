import { AppConfigService } from '@brickam/config-kit';
import { ServiceUnavailableException } from '@brickam/core-kit';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { RateQuote, RateView } from '../@types';
import { ExchangeRatesRepository } from './exchange-rates.repository';
import { FallbackRatesProvider } from './fallback-rates.provider';
import { RatesProvider } from './rates-provider';

/** Округление до 2 знаков (для денежных значений отображения). */
const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Запись in-memory кеша курса. */
type CachedRate = {
    rate: number;
    fetchedAt: Date;
};

/**
 * Сервис валют (Foundations §11, Stage 11). База расчётов — AMD; курсы хранят
 * «сколько AMD за 1 единицу валюты». Конвертация — ТОЛЬКО для отображения,
 * в логике заказа/комиссии всегда используется AMD.
 *
 * Кеш: in-memory `Map<currency, {rate, fetchedAt}>`, наполняется при refresh и
 * лениво из БД. Дневное обновление по @Cron в 6:00. Фолбэк: при сбое провайдера
 * остаётся последний сохранённый курс (кеш/БД), при холодном старте —
 * зашитый FallbackRatesProvider.
 */
@Injectable()
export class CurrencyService implements OnModuleInit {
    private readonly logger = new Logger('Currency');

    private readonly cache = new Map<string, CachedRate>();

    private readonly fallback = new FallbackRatesProvider();

    constructor(
        private readonly ratesRepository: ExchangeRatesRepository,
        private readonly provider: RatesProvider,
        private readonly config: AppConfigService,
    ) {}

    /** Базовая валюта расчётов (всегда AMD). */
    get baseCurrency(): string {
        return this.config.marketplace.baseCurrency;
    }

    /** Валюты отображения из конфига (включая базовую). */
    displayCurrencies(): string[] {
        return this.config.marketplace.displayCurrencies;
    }

    /** Валюты отображения без базовой — те, для которых нужны курсы. */
    private foreignCurrencies(): string[] {
        return this.displayCurrencies().filter((currency) => currency !== this.baseCurrency);
    }

    /** Первичная загрузка курсов при старте (не падать при ошибке). */
    async onModuleInit(): Promise<void> {
        await this.refresh();
    }

    /** Дневное обновление курсов в 6:00 (ошибки гасятся внутри refresh). */
    @Cron(CronExpression.EVERY_DAY_AT_6AM)
    async dailyRefresh(): Promise<void> {
        await this.refresh();
    }

    /**
     * Обновляет курсы из провайдера: при успехе — сохраняет в БД (история) и
     * обновляет кеш; при ошибке провайдера — НЕ падает, логирует и оставляет
     * прежние курсы (фолбэк на последний сохранённый).
     */
    async refresh(): Promise<void> {
        const currencies = this.foreignCurrencies();
        if (currencies.length === 0) {
            return;
        }

        let quotes: RateQuote[];
        try {
            quotes = await this.provider.fetchLatest(currencies);
        } catch (error) {
            this.logger.warn(
                `Rates refresh failed (${this.provider.name}), keeping previous: ${
                    (error as Error).message
                }`,
            );
            return;
        }

        const fetchedAt = new Date();
        for (const quote of quotes) {
            await this.ratesRepository.create({
                base: this.baseCurrency,
                currency: quote.currency,
                rate: quote.rate,
                fetchedAt,
                source: this.provider.name,
            });
            this.cache.set(quote.currency, { rate: quote.rate, fetchedAt });
        }
        this.logger.log(`Rates refreshed (${this.provider.name}): ${quotes.length} currencies`);
    }

    /**
     * Курс валюты — «сколько AMD за 1 единицу». Для базовой → 1. Иначе: кеш →
     * БД (последний по fetchedAt, кладётся в кеш) → зашитый фолбэк. Если совсем
     * нет — ServiceUnavailable.
     */
    async getRate(currency: string): Promise<number> {
        if (currency === this.baseCurrency) {
            return 1;
        }

        const cached = this.cache.get(currency);
        if (cached) {
            return cached.rate;
        }

        const stored = await this.ratesRepository.latestByCurrency(currency);
        if (stored) {
            this.cache.set(currency, { rate: stored.rate, fetchedAt: stored.fetchedAt });
            return stored.rate;
        }

        const [seed] = await this.fallback.fetchLatest([currency]);
        if (seed) {
            this.cache.set(seed.currency, { rate: seed.rate, fetchedAt: new Date() });
            return seed.rate;
        }

        throw new ServiceUnavailableException('errors.currency.rateUnavailable');
    }

    /**
     * Конвертирует сумму из AMD в валюту отображения (round2). Для базовой
     * валюты — без изменений. Чистая функция: НЕ влияет на исходную AMD-сумму
     * и не используется в логике заказа.
     */
    async convert(amountAmd: number, currency: string): Promise<number> {
        if (currency === this.baseCurrency) {
            return amountAmd;
        }
        const rate = await this.getRate(currency);
        return round2(amountAmd / rate);
    }

    /**
     * Актуальные курсы по всем валютам отображения (для фронта). Базовая → 1;
     * остальные — текущий курс с временем фиксации.
     */
    async getRates(): Promise<RateView[]> {
        const views: RateView[] = [];
        for (const currency of this.displayCurrencies()) {
            if (currency === this.baseCurrency) {
                views.push({ currency, rate: 1, fetchedAt: new Date() });
                continue;
            }
            const cached = this.cache.get(currency);
            if (cached) {
                views.push({ currency, rate: cached.rate, fetchedAt: cached.fetchedAt });
                continue;
            }
            const rate = await this.getRate(currency);
            const refreshed = this.cache.get(currency);
            views.push({
                currency,
                rate,
                fetchedAt: refreshed?.fetchedAt ?? new Date(),
            });
        }
        return views;
    }
}
