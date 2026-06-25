import type {
    ChargeResult,
    InitiateInput,
    InitiateResult,
    RefundResult,
    StatusResult,
    WebhookEvent,
} from '../../@types';

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

    /**
     * Инициирует redirect-флоу (карты ArCa/Idram): регистрирует платёж у PSP и
     * возвращает URL платёжной страницы + `providerRef` для сопоставления
     * callback'а. Дефолт — `null`: синхронные провайдеры (mock) оплачивают через
     * `charge`, без редиректа. Реализации redirect-провайдеров переопределяют.
     */
    async initiate(_input: InitiateInput): Promise<InitiateResult | null> {
        return null;
    }

    /**
     * Pull-подтверждение статуса по `providerRef` (ArCa getOrderStatus, вызывается
     * из callback'а возврата). Дефолт — `null`: провайдер не поддерживает pull
     * (подтверждение приходит push-вебхуком или синхронно).
     */
    async getStatus(_providerRef: string): Promise<StatusResult | null> {
        return null;
    }
}
