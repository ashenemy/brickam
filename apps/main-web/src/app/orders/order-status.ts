import type { BadgeTone } from '@brickam/ui-kit';
import type { DeliveryStatus, OrderStatus } from './models';

/** Тон бейджа для статуса заказа. */
export function orderStatusTone(status: OrderStatus): BadgeTone {
    switch (status) {
        case 'completed':
            return 'success';
        case 'paid':
        case 'processing':
            return 'accent';
        case 'cancelled':
            return 'danger';
        default:
            return 'neutral';
    }
}

/** Тон бейджа для статуса доставки. */
export function deliveryStatusTone(status: DeliveryStatus): BadgeTone {
    switch (status) {
        case 'delivered':
            return 'success';
        case 'in_transit':
        case 'picked':
            return 'accent';
        case 'cancelled':
            return 'danger';
        default:
            return 'neutral';
    }
}

/** Упорядоченные шаги доставки для трекинга (без cancelled). */
export const DELIVERY_STEPS: readonly DeliveryStatus[] = [
    'accepted',
    'picked',
    'in_transit',
    'delivered',
] as const;
