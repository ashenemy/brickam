import type { ChargeResult, RefundResult, WebhookEvent } from '../../@types';

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

    /**
     * Разбирает и верифицирует асинхронный вебхук провайдера. Возвращает
     * нормализованное событие либо `null`, если payload не распознан или подпись
     * невалидна. Синхронный — верификация подписи не требует сети.
     */
    abstract parseWebhook(payload: unknown, signature?: string): WebhookEvent | null;

    /** Возвращает средства по транзакции провайдера (`providerRef`). */
    abstract refund(providerRef: string, amount: number): Promise<RefundResult>;
}
