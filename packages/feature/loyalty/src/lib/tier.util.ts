import { roundAmd } from '@brickam/domain-kit';
import type { Tier } from '../@types';

/**
 * Текущий уровень покупателя — макс. tier, чей `threshold ≤ metricValue`.
 * Если ни один порог не достигнут (все `threshold > metricValue`) → undefined.
 */
export function selectTier(tiers: Tier[], metricValue: number): Tier | undefined {
    let selected: Tier | undefined;
    for (const tier of tiers) {
        if (tier.threshold <= metricValue) {
            if (selected === undefined || tier.threshold > selected.threshold) {
                selected = tier;
            }
        }
    }
    return selected;
}

/**
 * Сумма скидки лояльности (целые AMD, неотрицательно, в [0, amount]):
 * percent → round(amount * discountValue / 100); amount → min(discountValue, amount).
 */
export function computeLoyaltyDiscount(amount: number, tier: Tier): number {
    const raw =
        tier.discountType === 'percent'
            ? roundAmd((amount * tier.discountValue) / 100)
            : Math.min(tier.discountValue, amount);
    return Math.max(0, Math.min(raw, amount));
}

/** Идентификатор уровня (стабильно по level). */
export function tierId(tier: Tier): string {
    return String(tier.level);
}
