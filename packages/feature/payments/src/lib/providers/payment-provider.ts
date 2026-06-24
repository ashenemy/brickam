import type { ChargeResult } from '../../@types';

/**
 * Абстрактный провайдер платежей. Реализации скрывают конкретного провайдера
 * (mock/idram/telcell/arca) за этим интерфейсом — сервис платежей зависит
 * только от него (Foundations §11/§16).
 */
export abstract class PaymentProvider {
    /** Имя провайдера (совпадает с `config.providers.payment`). */
    abstract name: string;

    /** Списывает сумму; `ref` — идентификатор платежа на нашей стороне. */
    abstract charge(amount: number, ref: string): Promise<ChargeResult>;
}
