import type { DiscountInput } from '../@types';

/** Округление до целого драма (AMD). */
export const roundAmd = (value: number): number => Math.round(value);

/** Активна ли скидка в момент `now` (нет окна → активна). */
export const isDiscountActive = (
    discount: DiscountInput | undefined | null,
    now: Date = new Date(),
): boolean => {
    if (!discount) {
        return false;
    }
    const t = now.getTime();
    if (discount.activeFrom && t < new Date(discount.activeFrom).getTime()) {
        return false;
    }
    if (discount.activeTo && t > new Date(discount.activeTo).getTime()) {
        return false;
    }
    return true;
};

/** Цена единицы после товарной скидки (целые AMD, не ниже 0). */
export const applyDiscount = (
    price: number,
    discount: DiscountInput | undefined | null,
    now: Date = new Date(),
): number => {
    if (!isDiscountActive(discount, now)) {
        return price;
    }
    const d = discount as DiscountInput;
    if (d.type === 'percent') {
        return Math.max(0, roundAmd(price * (1 - d.value / 100)));
    }
    return Math.max(0, roundAmd(price - d.value));
};

/**
 * Комиссия с продавца (Foundations §11): на сумму позиции после скидки, целые AMD.
 * commissionAmount = round(subtotalAfterDiscount * commissionPercent / 100).
 */
export const calcCommission = (subtotalAfterDiscount: number, commissionPercent: number): number =>
    roundAmd((subtotalAfterDiscount * commissionPercent) / 100);
