import { buildCategories } from './builders/categories';
import { buildChats, type ChatSeedClock } from './builders/chats';
import { buildExchangeRates } from './builders/currency';
import { buildLoyaltyProgram } from './builders/loyalty';
import { buildPlatformSettings } from './builders/platform-settings';
import { buildProducts } from './builders/products';
import { buildReviews, computeRatingAggregates } from './builders/reviews';
import { buildTemplates } from './builders/templates';
import { buildUsers } from './builders/users';
import { buildVendors } from './builders/vendors';
import { COLLECTIONS, type SeedDataset } from './types';

/** Явно передаваемое время (детерминированность билдеров — без Date.now). */
export type SeedClock = {
    /** Курсы валют. */
    ratesFetchedAt: Date;
    /** Чаты/инвойсы. */
    chat: ChatSeedClock;
};

/** Дефолтный детерминированный clock для тестов/запуска без env. */
export const DEFAULT_CLOCK: SeedClock = {
    ratesFetchedAt: new Date('2026-01-01T00:00:00.000Z'),
    chat: {
        createdAt: new Date('2026-01-02T10:00:00.000Z'),
        validUntil: new Date('2026-01-09T10:00:00.000Z'),
    },
};

/**
 * Чистая сборка полного датасета (без сети и побочных эффектов). Рейтинги
 * отзывов согласованно вмерживаются в товары и вендоров: ratingAvg/ratingCount
 * у product/vendor берутся из агрегата по reviews.
 */
export function buildDataset(clock: SeedClock = DEFAULT_CLOCK): SeedDataset {
    const categories = buildCategories();
    const vendors = buildVendors();
    const users = buildUsers();
    const products = buildProducts();
    const reviews = buildReviews();
    const aggregates = computeRatingAggregates();

    // Вмерживаем рейтинги в товары по slug.
    for (const rec of products) {
        const slug = rec.key['slug'] as string;
        const agg = aggregates.byProductSlug.get(slug);
        if (agg !== undefined) {
            rec.doc['ratingAvg'] = agg.avg;
            rec.doc['ratingCount'] = agg.count;
        }
    }

    // Вмерживаем рейтинги в вендоров по slug.
    for (const rec of vendors) {
        const slug = rec.key['slug'] as string;
        const agg = aggregates.byVendorSlug.get(slug);
        if (agg !== undefined) {
            rec.doc['ratingAvg'] = agg.avg;
            rec.doc['ratingCount'] = agg.count;
        }
    }

    const chats = buildChats(clock.chat);
    const rates = buildExchangeRates(clock.ratesFetchedAt);
    const templates = buildTemplates();
    const loyalty = buildLoyaltyProgram();
    const settings = buildPlatformSettings();

    return [
        ...categories,
        ...vendors,
        ...users,
        ...products,
        ...reviews,
        ...chats,
        ...rates,
        ...templates,
        ...loyalty,
        ...settings,
    ];
}

/** Порядок коллекций в отчёте (для стабильного вывода). */
export const COLLECTION_ORDER: string[] = [
    COLLECTIONS.categories,
    COLLECTIONS.vendors,
    COLLECTIONS.users,
    COLLECTIONS.products,
    COLLECTIONS.reviews,
    COLLECTIONS.chats,
    COLLECTIONS.messages,
    COLLECTIONS.invoices,
    COLLECTIONS.exchangeRates,
    COLLECTIONS.templates,
    COLLECTIONS.loyaltyPrograms,
    COLLECTIONS.platformSettings,
];
