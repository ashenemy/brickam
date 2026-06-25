import type { LoyaltyBasis, LoyaltyMetric } from '@brickam/domain-kit';

/** Тип скидки уровня лояльности. */
export type LoyaltyDiscountType = 'percent' | 'amount';

/**
 * Уровень программы лояльности. `threshold` — минимальная метрика (по basis),
 * с которой уровень становится текущим. Скидку несёт платформа.
 */
export type Tier = {
    level: number;
    name: string;
    threshold: number;
    discountType: LoyaltyDiscountType;
    discountValue: number;
};

/** Публичное представление программы лояльности (basis + уровни). */
export type LoyaltyProgramView = {
    basis: LoyaltyBasis;
    tiers: Tier[];
};

/** POJO создания программы из админ-конструктора (создаётся НЕ активной). */
export type CreateProgramData = {
    basis: LoyaltyBasis;
    tiers: Tier[];
};

/** POJO частичного обновления программы. */
export type UpdateProgramData = {
    basis?: LoyaltyBasis;
    tiers?: Tier[];
};

/**
 * Статус лояльности покупателя для UI: метрика, текущий уровень и
 * «сколько осталось» до следующего уровня (если он есть).
 */
export type LoyaltyStatusView = {
    metric: LoyaltyMetric;
    basis: LoyaltyBasis;
    currentTier?: Tier;
    nextTier?: Tier;
    toNext?: number;
};
