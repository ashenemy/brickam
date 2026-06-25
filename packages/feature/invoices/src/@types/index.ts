import type { DiscountInput, InvoiceLineItem } from '@brickam/domain-kit';

/** Статус инвойса (Foundations §15, Stage 9). */
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'expired' | 'cancelled';

/** Тип скидки инвойса. */
export type InvoiceDiscountType = 'percent' | 'amount';

/** Скидка на инвойс (под-документ). */
export type InvoiceDiscount = {
    type: InvoiceDiscountType;
    value: number;
};

/** Итоги расчёта инвойса (целые AMD). */
export type InvoiceTotals = {
    subtotal: number;
    total: number;
};

/** Инвойс (публичный API-контракт, без Mongoose-документа). */
export type InvoiceContract = {
    id: string;
    invoiceNumber: string;
    chatId: string;
    vendorId: string;
    buyerId: string;
    lineItems: InvoiceLineItem[];
    discount?: InvoiceDiscount;
    subtotal: number;
    total: number;
    currency: string;
    validUntil: Date;
    status: InvoiceStatus;
    orderId?: string;
    pdfUrl?: string;
    createdAt: Date;
    updatedAt: Date;
};

/** Результат оплаты инвойса (созданный заказ/платёж). */
export type InvoicePayResult = {
    invoice: InvoiceContract;
    orderId: string;
    paymentId: string;
};

export type { DiscountInput, InvoiceLineItem };
