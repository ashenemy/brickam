/** Статусы заказа (Foundations §15). Эскроу нет — оплата обычным платежом. */
export enum OrderStatus {
    Created = 'created',
    Paid = 'paid',
    Processing = 'processing',
    Completed = 'completed',
    Cancelled = 'cancelled',
}

/** Статус доставки саб-заказа вендора. */
export enum DeliveryStatus {
    Accepted = 'accepted',
    Picked = 'picked',
    InTransit = 'in_transit',
    Delivered = 'delivered',
    Cancelled = 'cancelled',
}

/** Статус платежа. */
export enum PaymentStatus {
    Pending = 'pending',
    Succeeded = 'succeeded',
    Failed = 'failed',
    Refunded = 'refunded',
}
