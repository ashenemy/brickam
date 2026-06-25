/** Тип скидки уровня лояльности. */
export type LoyaltyDiscountType = 'percent' | 'amount';

/** Метрика накоплений пользователя (база для расчёта уровня). */
export type LoyaltyMetric = {
    totalSpend: number;
    totalOrders: number;
    currentTierId?: string;
};

/** Уровень программы лояльности. */
export type LoyaltyTier = {
    level: number;
    name: string;
    threshold: number;
    discountType: LoyaltyDiscountType;
    discountValue: number;
};

/** Текущий статус лояльности пользователя (GET /loyalty/me). */
export type LoyaltyStatus = {
    metric: LoyaltyMetric;
    currentTier?: LoyaltyTier;
    nextTier?: LoyaltyTier;
    toNext?: number;
};

/** Публичная программа лояльности (GET /loyalty/program). */
export type LoyaltyProgram = {
    basis: 'total_spend' | 'order_count';
    tiers: LoyaltyTier[];
};
