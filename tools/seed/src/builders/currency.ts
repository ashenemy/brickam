import { COLLECTIONS, type SeedRecord } from '../types';

/** Курс = сколько AMD за 1 единицу валюты (base AMD). */
const RATES: { currency: string; rate: number }[] = [
    { currency: 'USD', rate: 387 },
    { currency: 'EUR', rate: 418 },
    { currency: 'RUB', rate: 4.9 },
];

/**
 * Курсы валют. fetchedAt передаётся явно (детерминированность). Ключ upsert —
 * пара currency+source, чтобы повторный сид обновлял, а не дублировал.
 */
export function buildExchangeRates(fetchedAt: Date): SeedRecord[] {
    return RATES.map((r) => ({
        collection: COLLECTIONS.exchangeRates,
        key: { currency: r.currency, source: 'seed' },
        doc: {
            _id: `rate_seed_${r.currency}`,
            base: 'AMD',
            currency: r.currency,
            rate: r.rate,
            fetchedAt,
            source: 'seed',
        },
    }));
}
