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

/**
 * Разобранный и верифицированный вебхук провайдера. `providerRef` —
 * идентификатор транзакции у провайдера; `orderId` — наш заказ (если провайдер
 * прислал); `success` — подтверждена ли оплата.
 */
export type WebhookEvent = {
    providerRef: string;
    orderId?: string;
    success: boolean;
    /**
     * Idram-прехек (`EDP_PRECHECK==='YES'`): провайдер проверяет, готовы ли мы
     * принять платёж. На прехек отвечаем литералом `OK` без подтверждения оплаты.
     */
    precheck?: boolean;
};

/**
 * Результат инициации redirect-флоу (карты ArCa/Idram). `redirectUrl` — страница
 * PSP, куда фронт перенаправляет покупателя; `providerRef` сохраняется в платёж
 * для последующего сопоставления callback'а. Синхронные провайдеры (mock)
 * возвращают `null` — оплата идёт обычным `charge`.
 */
export type InitiateResult = {
    redirectUrl: string;
    providerRef: string;
};

/** Вход инициации redirect-платежа. */
export type InitiateInput = {
    amount: number;
    orderId: string;
    ref: string;
    returnUrl: string;
};

/** Результат pull-подтверждения статуса (ArCa getOrderStatus). */
export type StatusResult = {
    success: boolean;
};

/** Результат возврата у провайдера. */
export type RefundResult = {
    success: boolean;
    refundRef?: string;
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
