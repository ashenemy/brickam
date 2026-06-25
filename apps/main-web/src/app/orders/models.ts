import type { Localized, PageMeta } from '../catalog/models';

/** Статус заказа (соответствует backend OrderStatus). */
export type OrderStatus = 'created' | 'paid' | 'processing' | 'completed' | 'cancelled';

/** Статус доставки саб-заказа (соответствует backend DeliveryStatus). */
export type DeliveryStatus = 'accepted' | 'picked' | 'in_transit' | 'delivered' | 'cancelled';

/** Снимок адреса доставки в заказе. */
export type DeliveryAddress = {
    label: string;
    region: string;
    city: string;
    line1: string;
    line2?: string;
    phone: string;
};

/** Заказ покупателя. */
export type Order = {
    id: string;
    orderNumber: string;
    buyerId?: string;
    status: OrderStatus;
    subtotal: number;
    productDiscountTotal: number;
    loyaltyDiscount: number;
    total: number;
    currencyShown: string;
    paymentId?: string;
    deliveryAddressSnapshot: DeliveryAddress;
    createdAt?: string;
    updatedAt?: string;
};

/** Позиция саб-заказа вендора. */
export type VendorOrderItem = {
    productId: string;
    titleSnapshot?: Localized;
    qty: number;
    unitPrice: number;
    discountApplied: number;
    lineTotal: number;
};

/** Событие изменения статуса доставки. */
export type DeliveryEvent = {
    status: DeliveryStatus;
    at: string;
    note?: string;
};

/** Саб-заказ вендора (с трекингом доставки). */
export type VendorOrder = {
    id: string;
    orderId: string;
    vendorId: string;
    items: VendorOrderItem[];
    subtotal: number;
    deliveryStatus: DeliveryStatus;
    deliveryEvents: DeliveryEvent[];
};

/** Результат оформления заказа (POST /orders/checkout). */
export type CheckoutResult = {
    order: Order;
    vendorOrders: VendorOrder[];
    payment?: unknown;
    splits?: unknown[];
};

/** Адрес для оформления заказа. */
export type CheckoutAddress = DeliveryAddress;

/** Пагинированный список заказов (GET /orders). */
export type OrderListResult = {
    data: Order[];
    meta: PageMeta;
};
