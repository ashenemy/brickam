import { ServiceUnavailableException } from '@brickam/core-kit';
import { Injectable, Logger } from '@nestjs/common';
import type { RateQuote } from '../@types';
import { RatesProvider } from './rates-provider';

/** Эндпоинт ЦБ Армении с актуальными курсами (AMD за 1 единицу валюты). */
const CBA_RATES_URL = 'https://cb.am/latest.json.php';

/** Таймаут сетевого запроса к провайдеру курсов, мс. */
const FETCH_TIMEOUT_MS = 5000;

/**
 * Провайдер курсов ЦБ Армении (Foundations §11). Тянет курсы нативным `fetch`
 * (без axios). Ответ — объект `{ "USD": 390.5, "EUR": 420.1, ... }`, где
 * значение — сколько AMD за 1 единицу валюты. При сетевой ошибке/таймауте
 * бросает `ServiceUnavailableException`, чтобы сервис ушёл в фолбэк.
 */
@Injectable()
export class CbaRatesProvider extends RatesProvider {
    override readonly name = 'cba';

    private readonly logger = new Logger('Currency');

    override async fetchLatest(currencies: string[]): Promise<RateQuote[]> {
        const raw = await this.fetchRaw();
        return this.parse(raw, currencies);
    }

    /** Загружает сырой ответ провайдера с таймаутом через AbortController. */
    private async fetchRaw(): Promise<unknown> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        try {
            const response = await fetch(CBA_RATES_URL, { signal: controller.signal });
            if (!response.ok) {
                throw new Error(`CBA responded ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            this.logger.error(`CBA fetch failed: ${(error as Error).message}`);
            throw new ServiceUnavailableException('errors.currency.providerUnavailable');
        } finally {
            clearTimeout(timer);
        }
    }

    /**
     * Достаёт из ответа только запрошенные валюты с валидным числовым курсом.
     * Устойчив к формату: отсутствующие/нечисловые значения пропускаются.
     */
    private parse(raw: unknown, currencies: string[]): RateQuote[] {
        if (raw === null || typeof raw !== 'object') {
            return [];
        }
        const map = raw as Record<string, unknown>;
        const quotes: RateQuote[] = [];
        for (const currency of currencies) {
            const value = map[currency];
            const rate = typeof value === 'string' ? Number(value) : value;
            if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) {
                quotes.push({ currency, rate });
            }
        }
        return quotes;
    }
}
