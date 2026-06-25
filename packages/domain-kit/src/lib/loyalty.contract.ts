import type { LoyaltyDiscountPreview } from '../@types';

/**
 * Контракт лояльности (Foundations §11). Реализует feature `loyalty`; `orders`
 * зависит только от контракта. Скидку лояльности несёт ПЛАТФОРМА: комиссия и
 * payout вендора считаются ДО неё и не меняются.
 */
export abstract class LoyaltyServiceContract {
    /**
     * Предпросмотр скидки лояльности на оформлении — по текущему уровню
     * покупателя, от суммы заказа после товарных скидок. Итог скидки ≥ 0.
     */
    abstract previewDiscount(
        buyerId: string,
        amountAfterProductDiscount: number,
    ): Promise<LoyaltyDiscountPreview>;

    /**
     * Фиксирует завершённый заказ: растит метрику (по basis), пересчитывает
     * уровень покупателя и пишет в ledger.
     */
    abstract recordCompletedOrder(buyerId: string, orderTotal: number): Promise<void>;
}
