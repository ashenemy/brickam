import type {
    CreatePaymentInput,
    InvoiceOrderInput,
    InvoiceOrderResult,
    ProductSnapshot,
    VendorOrderForReview,
} from '../@types';
import type { PaymentStatus } from './order-status';

/**
 * Непрозрачный токен транзакционной сессии (Mongoose ClientSession). Объявлен
 * как unknown, чтобы domain-kit не зависел от mongoose; реализации приводят тип.
 * Когда передан — запись выполняется в рамках транзакции checkout (§11).
 */
export type TxSession = unknown;

/**
 * Контракт каталога. Реализует feature `catalog`; `orders`/`reviews` зависят
 * только от контракта (не импортируют catalog напрямую).
 */
export abstract class CatalogServiceContract {
    abstract getProductSnapshot(productId: string): Promise<ProductSnapshot | null>;
    /** Списывает остаток (проверяет наличие; недостаток → ошибка). */
    abstract decrementStock(productId: string, qty: number, session?: TxSession): Promise<void>;
    /** Проставляет агрегированный рейтинг товара (пересчёт в reviews, Stage 7). */
    abstract setProductRating(
        productId: string,
        ratingAvg: number,
        ratingCount: number,
    ): Promise<void>;
}

/**
 * Контракт заказов для проверки права на отзыв (Foundations §15, Stage 7).
 * Реализует feature `orders`; `reviews` зависит только от контракта.
 */
export abstract class OrdersServiceContract {
    abstract getVendorOrderForReview(vendorOrderId: string): Promise<VendorOrderForReview | null>;
    /** Создаёт заказ из оплаченного инвойса (один вендор, комиссия по §11). */
    abstract createFromInvoice(input: InvoiceOrderInput): Promise<InvoiceOrderResult>;
}

/**
 * Контракт чата для постинга инвойс-сообщения. Реализует feature `chat`;
 * `invoices` зависит только от контракта.
 */
export abstract class ChatServiceContract {
    abstract postInvoiceMessage(chatId: string, senderId: string, invoiceId: string): Promise<void>;
}

/** Результат операций платежа. */
export type PaymentResult = {
    paymentId: string;
    status: PaymentStatus;
};

/**
 * Контракт платежей. Реализует feature `payments`; `orders` создаёт один платёж
 * на сумму заказа с разбивкой `splits[]` по вендорам (Foundations §11).
 */
export abstract class PaymentsServiceContract {
    abstract createForOrder(input: CreatePaymentInput, session?: TxSession): Promise<PaymentResult>;
    abstract confirm(paymentId: string): Promise<PaymentResult>;
    abstract getByOrder(orderId: string): Promise<{ id: string; status: PaymentStatus } | null>;
}
