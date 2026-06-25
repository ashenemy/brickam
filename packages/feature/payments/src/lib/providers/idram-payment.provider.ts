import { createHash } from 'node:crypto';
import { Logger } from '@nestjs/common';
import type {
    ChargeResult,
    InitiateInput,
    InitiateResult,
    RefundResult,
    WebhookEvent,
} from '../../@types';
import { PaymentProvider } from './payment-provider';

/** Конфигурация Idram (из `config.secrets`). */
export type IdramConfig = {
    gatewayUrl: string;
    recAccount: string;
    secretKey: string;
};

/** Поля callback'а Idram (form-urlencoded). */
type IdramCallback = {
    EDP_PRECHECK?: unknown;
    EDP_REC_ACCOUNT?: unknown;
    EDP_AMOUNT?: unknown;
    EDP_BILL_NO?: unknown;
    EDP_TRANS_ID?: unknown;
    EDP_PAYER_ACCOUNT?: unknown;
    EDP_CHECKSUM?: unknown;
};

/**
 * Провайдер Idram (карты/кошелёк), redirect-флоу с push-callback'ом и MD5-подписью.
 * `initiate` собирает URL платёжной страницы Idram (без сети). Idram присылает два
 * запроса: прехек (`EDP_PRECHECK==='YES'`) — отвечаем `OK`; затем результат с
 * `EDP_CHECKSUM` — сверяем MD5 и при совпадении подтверждаем оплату.
 *
 * TODO(merchant): набор полей и формат суммы/описания сверяются с мерчант-договором
 * Idram (EDP_*). Возврат по API Idram обычно не выполняется — только вручную.
 */
export class IdramPaymentProvider extends PaymentProvider {
    override name = 'idram';

    private readonly logger = new Logger('Payment');

    constructor(private readonly cfg: IdramConfig) {
        super();
    }

    /** Собирает redirect-URL платёжной страницы Idram (синхронно, без сети). */
    override async initiate(input: InitiateInput): Promise<InitiateResult | null> {
        const params = new URLSearchParams({
            EDP_LANGUAGE: 'AM',
            EDP_REC_ACCOUNT: this.cfg.recAccount,
            EDP_DESCRIPTION: input.orderId,
            EDP_AMOUNT: String(input.amount),
            EDP_BILL_NO: input.ref,
        });
        return {
            redirectUrl: `${this.cfg.gatewayUrl}?${params.toString()}`,
            providerRef: input.ref,
        };
    }

    /**
     * Разбирает callback Idram. Прехек (`EDP_PRECHECK==='YES'`) → маркер precheck.
     * Иначе сверяет MD5(`REC_ACCOUNT:AMOUNT:BILL_NO:secretKey:TRANS_ID:PAYER_ACCOUNT`)
     * в UPPERCASE с `EDP_CHECKSUM`: совпало → success; иначе `null`.
     */
    override parseWebhook(payload: unknown, _signature?: string): WebhookEvent | null {
        if (typeof payload !== 'object' || payload === null) {
            return null;
        }
        const p = payload as IdramCallback;
        const billNo = this.str(p.EDP_BILL_NO);
        if (billNo === undefined) {
            return null;
        }

        if (this.str(p.EDP_PRECHECK) === 'YES') {
            return { providerRef: billNo, success: false, precheck: true };
        }

        const recAccount = this.str(p.EDP_REC_ACCOUNT);
        const amount = this.str(p.EDP_AMOUNT);
        const transId = this.str(p.EDP_TRANS_ID);
        const payerAccount = this.str(p.EDP_PAYER_ACCOUNT);
        const checksum = this.str(p.EDP_CHECKSUM);
        if (
            recAccount === undefined ||
            amount === undefined ||
            transId === undefined ||
            payerAccount === undefined ||
            checksum === undefined
        ) {
            return null;
        }

        const raw = `${recAccount}:${amount}:${billNo}:${this.cfg.secretKey}:${transId}:${payerAccount}`;
        const expected = createHash('md5').update(raw).digest('hex').toUpperCase();
        if (expected !== checksum.toUpperCase()) {
            this.logger.warn(`Idram checksum mismatch for bill ${billNo}`);
            return null;
        }

        return { providerRef: billNo, success: true };
    }

    /** Возврат через API Idram не поддерживается — только ручной возврат (TODO). */
    override async refund(providerRef: string, _amount: number): Promise<RefundResult> {
        this.logger.warn(`Idram refund must be done manually (providerRef=${providerRef})`);
        return { success: false };
    }

    /** Синхронный charge для redirect-флоу не используется. */
    override async charge(_amount: number, _ref: string): Promise<ChargeResult> {
        throw new Error('IdramPaymentProvider does not support synchronous charge; use initiate');
    }

    /** Приводит значение к непустой строке либо `undefined`. */
    private str(value: unknown): string | undefined {
        if (typeof value === 'string' && value.length > 0) {
            return value;
        }
        if (typeof value === 'number') {
            return String(value);
        }
        return undefined;
    }
}
