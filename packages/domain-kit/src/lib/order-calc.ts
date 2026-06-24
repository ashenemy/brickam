import type {
    OrderCalcResult,
    OrderLineInput,
    VendorBreakdown,
    VendorOrderItem,
    VendorSplit,
} from '../@types';
import { applyDiscount, calcCommission } from './money';

/**
 * Расчёт заказа (Foundations §11). Один платёж разбивается по вендорам;
 * комиссия берётся с продавца на сумму позиции ПОСЛЕ скидки, в целых AMD;
 * payout = subtotalAfterDiscount − commissionAmount. Эскроу нет.
 * loyaltyDiscount пока 0 (применится в Stage 12 — на сумму после товарных скидок).
 */
export function calculateOrder(
    lines: OrderLineInput[],
    commissionPercent: number,
    now: Date = new Date(),
): OrderCalcResult {
    let subtotal = 0;
    let productDiscountTotal = 0;
    const byVendor = new Map<string, { items: VendorOrderItem[]; subtotal: number }>();

    for (const line of lines) {
        const gross = line.price * line.qty;
        const discountedUnit = applyDiscount(line.price, line.discount, now);
        const lineTotal = discountedUnit * line.qty;

        subtotal += gross;
        productDiscountTotal += gross - lineTotal;

        const bucket = byVendor.get(line.vendorId) ?? { items: [], subtotal: 0 };
        bucket.items.push({
            productId: line.productId,
            qty: line.qty,
            unitPrice: line.price,
            discountApplied: line.price - discountedUnit,
            lineTotal,
            ...(line.titleSnapshot !== undefined ? { titleSnapshot: line.titleSnapshot } : {}),
        });
        bucket.subtotal += lineTotal;
        byVendor.set(line.vendorId, bucket);
    }

    const vendors: VendorBreakdown[] = [];
    const splits: VendorSplit[] = [];
    for (const [vendorId, bucket] of byVendor) {
        const commissionAmount = calcCommission(bucket.subtotal, commissionPercent);
        const payoutAmount = bucket.subtotal - commissionAmount;
        vendors.push({
            vendorId,
            items: bucket.items,
            subtotal: bucket.subtotal,
            commissionPercent,
            commissionAmount,
            payoutAmount,
        });
        splits.push({ vendorId, amount: bucket.subtotal, commissionAmount, payoutAmount });
    }

    const loyaltyDiscount = 0;
    const total = subtotal - productDiscountTotal - loyaltyDiscount;
    return { subtotal, productDiscountTotal, loyaltyDiscount, total, vendors, splits };
}
