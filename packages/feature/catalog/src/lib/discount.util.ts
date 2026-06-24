import type { Discount } from '../@types';

/**
 * Активна ли скидка в момент `now`. Если окно не задано (нет activeFrom и
 * activeTo) — скидка активна всегда. Иначе: activeFrom<=now<=activeTo
 * (отсутствующая граница не ограничивает).
 */
export const isDiscountActive = (discount: Discount | undefined, now: Date): boolean => {
    if (!discount) {
        return false;
    }
    const from = discount.activeFrom;
    const to = discount.activeTo;
    if (!from && !to) {
        return true;
    }
    if (from && now < from) {
        return false;
    }
    if (to && now > to) {
        return false;
    }
    return true;
};

/**
 * Итоговая цена с учётом скидки (целые AMD). percent → round(price*(1-value/100)),
 * amount → max(0, round(price-value)). Нет скидки или окно неактивно → price.
 */
export const computeFinalPrice = (
    price: number,
    discount: Discount | undefined,
    now: Date,
): number => {
    if (!isDiscountActive(discount, now) || !discount) {
        return price;
    }
    if (discount.type === 'percent') {
        return Math.round(price * (1 - discount.value / 100));
    }
    return Math.max(0, Math.round(price - discount.value));
};
