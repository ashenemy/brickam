import type { CreatePaymentInput, ProductSnapshot } from '../@types';
import type { PaymentStatus } from './order-status';

/**
 * Контракт каталога для оформления заказа. Реализует feature `catalog`;
 * `orders` зависит только от контракта (не импортирует catalog напрямую).
 */
export abstract class CatalogServiceContract {
    abstract getProductSnapshot(productId: string): Promise<ProductSnapshot | null>;
    /** Списывает остаток (проверяет наличие; недостаток → ошибка). */
    abstract decrementStock(productId: string, qty: number): Promise<void>;
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
    abstract createForOrder(input: CreatePaymentInput): Promise<PaymentResult>;
    abstract confirm(paymentId: string): Promise<PaymentResult>;
    abstract getByOrder(orderId: string): Promise<{ id: string; status: PaymentStatus } | null>;
}
