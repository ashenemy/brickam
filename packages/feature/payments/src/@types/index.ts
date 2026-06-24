import type { PaymentStatus } from '@brickam/domain-kit';

/**
 * Поддерживаемые провайдеры платежей (Foundations §11). Значение приходит из
 * `config.providers.payment`. По умолчанию используется `mock` (заглушка).
 */
export type PaymentProviderName = 'mock' | 'idram' | 'telcell' | 'arca';

/** Результат списания у провайдера. */
export type ChargeResult = {
    providerRef: string;
    success: boolean;
};

/** Краткое представление платежа по заказу (наружу). */
export type PaymentByOrder = {
    id: string;
    status: PaymentStatus;
};

// Реэкспорт типов контракта/статуса для удобства потребителей.
export type {
    CreatePaymentInput,
    PaymentResult,
    VendorSplit,
} from '@brickam/domain-kit';
export { PaymentStatus } from '@brickam/domain-kit';
