/**
 * Общие типы датасета сида. Документы пишутся по формам Mongoose-схем
 * (packages/feature/*), но как сырые объекты — билдерам не нужен mongoose.
 */

/** Мультиязычный текст (Foundations §15: hy — дефолт). */
export type LocalizedText = {
    hy: string;
    ru: string;
    en: string;
};

/** Имена коллекций MongoDB (Mongoose-плюрализация классов + override-ы). */
export const COLLECTIONS = {
    categories: 'categories',
    vendors: 'vendors',
    products: 'products',
    users: 'users',
    reviews: 'reviews',
    chats: 'chats',
    messages: 'messages',
    invoices: 'invoices',
    exchangeRates: 'exchange_rates',
    templates: 'templates',
    loyaltyPrograms: 'loyaltyprograms',
    platformSettings: 'platform_settings',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/** Один документ датасета: целевая коллекция, стабильный ключ upsert и тело. */
export type SeedRecord = {
    collection: CollectionName;
    key: Record<string, unknown>;
    doc: Record<string, unknown>;
};

/** Весь датасет сида — плоский список записей, применяемых через store. */
export type SeedDataset = SeedRecord[];

/** Отчёт по одной коллекции. */
export type CollectionReport = {
    total: number;
    inserted: number;
    updated: number;
};

/** Итоговый отчёт сидирования. */
export type SeedReport = {
    byCollection: Record<string, CollectionReport>;
    inserted: number;
    updated: number;
    total: number;
};
