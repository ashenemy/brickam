import { COLLECTIONS, type SeedRecord } from '../types';

/**
 * Стартовая программа лояльности (соответствует DEFAULT_PROGRAM из
 * @brickam/loyalty: basis total_spend, уровни Bronze/Silver/Gold). active: true,
 * одновременно активна одна программа. Стабильный _id → идемпотентность.
 */
export function buildLoyaltyProgram(): SeedRecord[] {
    return [
        {
            collection: COLLECTIONS.loyaltyPrograms,
            key: { _id: 'loyalty_default' },
            doc: {
                _id: 'loyalty_default',
                basis: 'total_spend',
                active: true,
                tiers: [
                    {
                        level: 1,
                        name: 'Bronze',
                        threshold: 0,
                        discountType: 'percent',
                        discountValue: 0,
                    },
                    {
                        level: 2,
                        name: 'Silver',
                        threshold: 100000,
                        discountType: 'percent',
                        discountValue: 3,
                    },
                    {
                        level: 3,
                        name: 'Gold',
                        threshold: 500000,
                        discountType: 'percent',
                        discountValue: 5,
                    },
                ],
            },
        },
    ];
}
