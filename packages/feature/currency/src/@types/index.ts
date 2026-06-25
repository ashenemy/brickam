/**
 * Типы фичи валют (Foundations §11, Stage 11). База расчётов — AMD; курсы
 * хранят «сколько AMD за 1 единицу валюты». Конвертация — только для
 * отображения, в логике заказа/комиссии всегда используется AMD.
 */

/**
 * Котировка курса от провайдера/из БД: `rate` = сколько AMD за 1 единицу
 * `currency` (например, 1 USD ≈ 390 AMD).
 */
export type RateQuote = {
    currency: string;
    rate: number;
};

/** Представление курса наружу (для фронта): курс + время фиксации. */
export type RateView = {
    currency: string;
    rate: number;
    fetchedAt: Date;
};

/** Ответ списка отображаемых валют относительно базовой. */
export type DisplayCurrenciesView = {
    base: string;
    currencies: string[];
};

/** Ответ конвертации суммы из AMD в валюту отображения. */
export type ConversionView = {
    amount: number;
    currency: string;
    converted: number;
};
