import { Logger } from '@nestjs/common';
import type {
    ChargeResult,
    InitiateInput,
    InitiateResult,
    RefundResult,
    StatusResult,
    WebhookEvent,
} from '../../@types';
import { PaymentProvider } from './payment-provider';

/** Конфигурация ArCa VPOS (из `config.secrets`). */
export type ArcaConfig = {
    gatewayUrl: string;
    username: string;
    password: string;
};

/** Поля ответа registerOrder.do. */
type RegisterOrderResponse = {
    orderId?: string;
    formUrl?: string;
    errorCode?: string | number;
    errorMessage?: string;
};

/** Поля ответа getOrderStatus.do. */
type OrderStatusResponse = {
    OrderStatus?: number;
    orderStatus?: number;
    errorCode?: string | number;
};

/** Поля ответа refund.do. */
type RefundResponse = {
    errorCode?: string | number;
    errorMessage?: string;
};

/** Статус «оплачен» в ArCa getOrderStatus. */
const ARCA_STATUS_PAID = 2;

/** Таймаут сетевых запросов к ArCa (мс) — защита от зависания PSP. */
const ARCA_TIMEOUT_MS = 10_000;

/**
 * Провайдер карточного эквайринга ArCa (ArmenianCard) — VPOS, redirect-флоу с
 * pull-подтверждением. `initiate` регистрирует заказ и отдаёт `formUrl`; покупатель
 * платит на стороне банка; по возврату на callback мы тянем статус `getStatus`.
 * Push-вебхуков ArCa не шлёт — `parseWebhook` всегда `null`.
 *
 * TODO(merchant): точные имена полей запроса/ответа, формат суммы (минорные
 * единицы) и код валюты сверяются с мерчант-договором/sandbox-инструкцией ArCa.
 */
export class ArcaPaymentProvider extends PaymentProvider {
    override name = 'arca';

    private readonly logger = new Logger('Payment');

    constructor(private readonly cfg: ArcaConfig) {
        super();
    }

    /** Регистрирует заказ в ArCa и возвращает URL платёжной страницы банка. */
    override async initiate(input: InitiateInput): Promise<InitiateResult | null> {
        const body = new URLSearchParams({
            userName: this.cfg.username,
            password: this.cfg.password,
            orderNumber: input.ref,
            // TODO(merchant): сумма в минорных единицах AMD (×100); валюта 051 (AMD).
            amount: String(Math.round(input.amount * 100)),
            currency: '051',
            returnUrl: input.returnUrl,
        });

        const data = (await this.postForm('registerOrder.do', body)) as RegisterOrderResponse;

        if (String(data.errorCode ?? '') !== '0' || !data.formUrl || !data.orderId) {
            throw new Error(
                `ArCa registerOrder failed: errorCode=${data.errorCode} ${data.errorMessage ?? ''}`,
            );
        }

        return { redirectUrl: data.formUrl, providerRef: data.orderId };
    }

    /**
     * Тянет статус заказа из ArCa; success === статус «оплачен» (2). При сетевой
     * ошибке/таймауте возвращает `null` (не подтверждаем) — вызывающий код решает,
     * что делать (например, оставить платёж Pending и повторить позже).
     */
    override async getStatus(providerRef: string): Promise<StatusResult | null> {
        const body = new URLSearchParams({
            userName: this.cfg.username,
            password: this.cfg.password,
            orderId: providerRef,
        });

        try {
            const data = (await this.postForm('getOrderStatus.do', body)) as OrderStatusResponse;
            const status = data.OrderStatus ?? data.orderStatus;
            return { success: status === ARCA_STATUS_PAID };
        } catch (err) {
            this.logger.warn(`ArCa getOrderStatus failed for ${providerRef}: ${String(err)}`);
            return null;
        }
    }

    /** Возврат средств через ArCa refund.do; success === errorCode '0'. */
    override async refund(providerRef: string, amount: number): Promise<RefundResult> {
        const body = new URLSearchParams({
            userName: this.cfg.username,
            password: this.cfg.password,
            orderId: providerRef,
            amount: String(Math.round(amount * 100)),
        });

        let data: RefundResponse;
        try {
            data = (await this.postForm('refund.do', body)) as RefundResponse;
        } catch (err) {
            this.logger.warn(`ArCa refund request failed: orderId=${providerRef}: ${String(err)}`);
            return { success: false };
        }
        const success = String(data.errorCode ?? '') === '0';

        if (!success) {
            this.logger.warn(
                `ArCa refund failed: orderId=${providerRef} errorCode=${data.errorCode}`,
            );
            return { success: false };
        }
        return { success: true, refundRef: `arca_refund_${providerRef}` };
    }

    /** ArCa не шлёт push-вебхук — подтверждение только через getStatus в callback. */
    override parseWebhook(_payload: unknown, _signature?: string): WebhookEvent | null {
        return null;
    }

    /** Синхронный charge для redirect-флоу не используется. */
    override async charge(_amount: number, _ref: string): Promise<ChargeResult> {
        throw new Error('ArcaPaymentProvider does not support synchronous charge; use initiate');
    }

    /**
     * POST form-urlencoded к API ArCa с таймаутом (AbortController). Бросает при
     * сетевой ошибке/таймауте/не-2xx — вызывающий метод решает, ловить ли ошибку.
     */
    private async postForm(path: string, body: URLSearchParams): Promise<unknown> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ARCA_TIMEOUT_MS);
        try {
            const res = await fetch(`${this.cfg.gatewayUrl}/${path}`, {
                method: 'POST',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                body,
                signal: controller.signal,
            });
            if (res.ok === false) {
                throw new Error(`ArCa ${path} HTTP ${res.status}`);
            }
            return await res.json();
        } finally {
            clearTimeout(timer);
        }
    }
}
