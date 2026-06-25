/** Конверт ответа API (без пагинации). */
export type ApiResponse<T> = {
    success: boolean;
    data: T;
};

/** Тип скидки: процент от subtotal или фиксированная сумма (AMD). */
export type DiscountType = 'percent' | 'amount';

/** Скидка инвойса. */
export type InvoiceDiscount = {
    type: DiscountType;
    value: number;
};

/** Статус инвойса. */
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled' | 'expired';

/** Позиция инвойса (наименование, количество, цена за единицу). */
export type InvoiceLineItem = {
    title: string;
    qty: number;
    price: number;
};

/** Тело запроса на создание инвойса. */
export type CreateInvoicePayload = {
    chatId: string;
    buyerId: string;
    lineItems: InvoiceLineItem[];
    discount?: InvoiceDiscount;
    validUntil: string;
    currency?: string;
};

/** Инвойс, возвращённый бэкендом. */
export type Invoice = {
    id: string;
    invoiceNumber: string;
    chatId: string;
    buyerId: string;
    lineItems: InvoiceLineItem[];
    discount?: InvoiceDiscount;
    subtotal: number;
    total: number;
    currency: string;
    status: InvoiceStatus;
    validUntil: string;
    pdfUrl?: string;
    createdAt?: string;
};
