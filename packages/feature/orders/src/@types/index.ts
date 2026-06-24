import type {
    DeliveryStatus,
    DiscountInput,
    LocalizedText,
    OrderStatus,
    PaymentResult,
    VendorSplit,
} from '@brickam/domain-kit';

/** Снимок адреса доставки (хранится в заказе). */
export type DeliveryAddressSnapshot = {
    label: string;
    region: string;
    city: string;
    line1: string;
    line2?: string;
    phone: string;
};

/** Позиция корзины (плоский контракт). */
export type CartItemContract = {
    productId: string;
    vendorId: string;
    qty: number;
    priceSnapshot: number;
    discountSnapshot?: DiscountInput;
};

/** Корзина (плоский контракт). */
export type CartContract = {
    buyerId: string;
    items: CartItemContract[];
};

/** Позиция саб-заказа вендора (плоский контракт). */
export type VendorOrderItemContract = {
    productId: string;
    titleSnapshot?: LocalizedText;
    qty: number;
    unitPrice: number;
    discountApplied: number;
    lineTotal: number;
};

/** Событие изменения статуса доставки. */
export type DeliveryEventContract = {
    status: DeliveryStatus;
    at: Date;
    note?: string;
};

/** Саб-заказ вендора (плоский контракт). */
export type VendorOrderContract = {
    id: string;
    orderId: string;
    vendorId: string;
    items: VendorOrderItemContract[];
    subtotal: number;
    commissionPercentSnapshot: number;
    commissionAmount: number;
    payoutAmount: number;
    deliveryStatus: DeliveryStatus;
    deliveryEvents: DeliveryEventContract[];
};

/** Заказ (плоский контракт). */
export type OrderContract = {
    id: string;
    orderNumber: string;
    buyerId: string;
    status: OrderStatus;
    subtotal: number;
    productDiscountTotal: number;
    loyaltyDiscount: number;
    total: number;
    currencyShown: string;
    paymentId?: string;
    deliveryAddressSnapshot: DeliveryAddressSnapshot;
};

/** Результат оформления заказа (checkout). */
export type CheckoutResult = {
    order: OrderContract;
    vendorOrders: VendorOrderContract[];
    payment: PaymentResult;
    splits: VendorSplit[];
};

export type { LocalizedText } from '@brickam/domain-kit';
