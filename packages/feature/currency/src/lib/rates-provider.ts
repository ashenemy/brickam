import type { RateQuote } from '../@types';

/**
 * Абстрактный провайдер курсов валют (Foundations §11/§16). Реализации
 * скрывают конкретный источник (ЦБ Армении `cba`, фолбэк) за этим
 * интерфейсом — сервис валют зависит только от него; выбор реализации
 * делается по `config.providers.exchangeRates`.
 */
export abstract class RatesProvider {
    /** Имя провайдера (совпадает с `config.providers.exchangeRates`). */
    abstract readonly name: string;

    /**
     * Возвращает актуальные курсы для запрошенных валют — «сколько AMD за 1
     * единицу». При сетевой ошибке/таймауте обязан бросить, чтобы сервис ушёл
     * в фолбэк (не кешировал мусор).
     */
    abstract fetchLatest(currencies: string[]): Promise<RateQuote[]>;
}
