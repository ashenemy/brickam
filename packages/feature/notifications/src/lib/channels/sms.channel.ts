/**
 * Абстрактный канал отправки SMS. Реализации скрывают конкретного провайдера
 * (mock/twilio/…) за этим интерфейсом — сервис уведомлений зависит только от него
 * (Foundations §16).
 */
export abstract class SmsChannel {
    abstract send(recipient: string, body: string): Promise<void>;
}
