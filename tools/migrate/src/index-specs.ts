import type { IndexSpec } from './types';

/**
 * КАНОНИЧЕСКИЙ список индексов BuildHub. Задан ЯВНО (а не выведен из ODM) —
 * это и документация, и источник истины, независимый от схем фич.
 *
 * Имена коллекций — фактические имена в MongoDB (collection-override из @Schema,
 * иначе mongoose-плюрализация имени класса в lowercase: VendorOrder →
 * `vendororders`, LoyaltyProgram → `loyaltyprograms` и т.п.). Индексы лягут
 * именно на те коллекции, которые создаёт приложение.
 *
 * В проде autoIndex выключен (db-kit) — эти индексы создаёт миграция
 * `0001-initial-indexes`. Поля сверены со схемами в packages/feature.
 */
export const INDEX_SPECS: IndexSpec[] = [
    // products (catalog) — collection 'products'
    { collection: 'products', keys: { slug: 1 }, options: { unique: true } },
    { collection: 'products', keys: { vendorId: 1 } },
    { collection: 'products', keys: { categoryId: 1 } },
    { collection: 'products', keys: { status: 1 } },
    // Полнотекстовый поиск по локализованным title/description (Foundations §15).
    {
        collection: 'products',
        keys: {
            'title.hy': 'text',
            'title.ru': 'text',
            'title.en': 'text',
            'description.hy': 'text',
            'description.ru': 'text',
            'description.en': 'text',
        },
        options: { name: 'products_text' },
    },

    // categories (catalog) — collection 'categories'
    { collection: 'categories', keys: { slug: 1 }, options: { unique: true } },
    { collection: 'categories', keys: { parentId: 1 } },

    // vendors — collection 'vendors'
    { collection: 'vendors', keys: { slug: 1 }, options: { unique: true } },
    { collection: 'vendors', keys: { ownerUserId: 1 } },
    { collection: 'vendors', keys: { status: 1 } },

    // users — collection 'users'
    { collection: 'users', keys: { phone: 1 }, options: { unique: true } },

    // reviews — collection 'reviews'
    { collection: 'reviews', keys: { vendorOrderId: 1 }, options: { unique: true } },
    { collection: 'reviews', keys: { vendorId: 1 } },
    { collection: 'reviews', keys: { productId: 1 } },

    // orders — collection 'orders'
    { collection: 'orders', keys: { orderNumber: 1 }, options: { unique: true } },
    { collection: 'orders', keys: { buyerId: 1 } },
    { collection: 'orders', keys: { createdAt: -1 } },

    // vendor-orders — collection 'vendororders' (нет collection-override)
    { collection: 'vendororders', keys: { orderId: 1 } },
    { collection: 'vendororders', keys: { vendorId: 1 } },
    { collection: 'vendororders', keys: { createdAt: -1 } },

    // chats — collection 'chats'
    { collection: 'chats', keys: { buyerId: 1, vendorId: 1 } },

    // messages — collection 'messages'
    { collection: 'messages', keys: { chatId: 1 } },

    // invoices — collection 'invoices'
    { collection: 'invoices', keys: { invoiceNumber: 1 }, options: { unique: true } },
    { collection: 'invoices', keys: { chatId: 1 } },

    // exchange_rates (currency) — collection 'exchange_rates'
    { collection: 'exchange_rates', keys: { currency: 1, fetchedAt: -1 } },

    // loyalty programs — collection 'loyaltyprograms' (нет collection-override)
    { collection: 'loyaltyprograms', keys: { active: 1 } },

    // loyalty ledger — collection 'loyaltyledgers' (нет collection-override)
    { collection: 'loyaltyledgers', keys: { userId: 1 } },

    // ai jobs — collection 'ai_jobs'
    { collection: 'ai_jobs', keys: { vendorId: 1 } },
    { collection: 'ai_jobs', keys: { productId: 1 } },

    // disputes — collection 'disputes'
    { collection: 'disputes', keys: { status: 1 } },
    { collection: 'disputes', keys: { vendorId: 1 } },

    // audit logs — collection 'audit_logs'
    { collection: 'audit_logs', keys: { actorId: 1 } },

    // platform settings (catalog) — collection 'platform_settings'
    { collection: 'platform_settings', keys: { key: 1 }, options: { unique: true } },

    // subscriptions — collection 'subscriptions'
    { collection: 'subscriptions', keys: { vendorId: 1 }, options: { unique: true } },

    // vendor members — collection 'vendormembers' (нет collection-override)
    { collection: 'vendormembers', keys: { vendorId: 1, userId: 1 }, options: { unique: true } },

    // pages — collection 'pages'
    { collection: 'pages', keys: { slug: 1 }, options: { unique: true } },

    // idempotency keys — collection 'idempotency_keys'. Уникальный ключ +
    // TTL: записи живут 24ч (86400с) после createdAt и автоматически удаляются.
    { collection: 'idempotency_keys', keys: { key: 1 }, options: { unique: true } },
    {
        collection: 'idempotency_keys',
        keys: { createdAt: 1 },
        options: { name: 'idempotency_keys_ttl', expireAfterSeconds: 86400 },
    },
];
