import { Injectable } from '@nestjs/common';
import type { RateQuote } from '../@types';
import { RatesProvider } from './rates-provider';

/**
 * Зашитые разумные курсы (AMD за 1 единицу) на случай холодного старта, когда
 * основной провайдер недоступен И в БД пусто. Не для боевых расчётов —
 * страховка, чтобы конвертация отображения не падала.
 */
const SEED_RATES: Readonly<Record<string, number>> = {
    USD: 390,
    EUR: 420,
    RUB: 4.2,
};

/**
 * Запасной провайдер курсов (Foundations §11). Возвращает зашитые курсы для
 * известных валют. name 'fallback'.
 */
@Injectable()
export class FallbackRatesProvider extends RatesProvider {
    override readonly name = 'fallback';

    override async fetchLatest(currencies: string[]): Promise<RateQuote[]> {
        return currencies
            .filter((currency) => SEED_RATES[currency] !== undefined)
            .map((currency) => ({ currency, rate: SEED_RATES[currency] as number }));
    }
}
