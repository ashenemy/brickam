/**
 * Абстрактный канал отправки Email. Реализации скрывают конкретного провайдера
 * (mock/SMTP/…) за этим интерфейсом — сервис уведомлений зависит только от него
 * (Foundations §16).
 */
export abstract class EmailChannel {
    abstract send(recipient: string, subject: string, body: string): Promise<void>;
}
