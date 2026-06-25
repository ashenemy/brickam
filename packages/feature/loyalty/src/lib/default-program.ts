import type { LoyaltyProgramView } from '../@types';

/**
 * ★-дефолт программы лояльности (Foundations §11). Используется, когда в БД нет
 * активной программы: basis = total_spend, три уровня Bronze/Silver/Gold.
 */
export const DEFAULT_PROGRAM: LoyaltyProgramView = {
    basis: 'total_spend',
    tiers: [
        { level: 1, name: 'Bronze', threshold: 0, discountType: 'percent', discountValue: 0 },
        { level: 2, name: 'Silver', threshold: 100000, discountType: 'percent', discountValue: 3 },
        { level: 3, name: 'Gold', threshold: 500000, discountType: 'percent', discountValue: 5 },
    ],
};
