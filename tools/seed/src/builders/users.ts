import { COLLECTIONS, type SeedRecord } from '../types';
import { VENDORS, vendorId, vendorOwnerUserId } from './vendors';

/** Стабильный id покупателя из телефона. */
export const buyerUserId = (phone: string): string => `user_${phone}`;

/**
 * Заглушка-хеш пароля (детерминированная, НЕ настоящий пароль). Формат bcrypt,
 * но это фиктивное значение только для демо-данных.
 */
const STUB_PASSWORD_HASH = '$2a$10$SEEDSEEDSEEDSEEDSEEDSEuJ8t6Ky0jv0xVnQ0demoHashStub00000';

export type BuyerSeed = {
    name: string;
    phone: string;
    lang: string;
};

/** 4 демо-покупателя (армянские имена, телефоны +374...). */
export const BUYERS: BuyerSeed[] = [
    { name: 'Նարեկ Մարտիրոսյան', phone: '+37499200001', lang: 'hy' },
    { name: 'Анна Хачатрян', phone: '+37499200002', lang: 'ru' },
    { name: 'Լիլիթ Ղազարյան', phone: '+37499200003', lang: 'hy' },
    { name: 'Сергей Оганесян', phone: '+37499200004', lang: 'ru' },
    { name: 'Mariam Sargsyan', phone: '+37499200005', lang: 'en' },
];

/** Vendor-owner пользователи (по одному на вендора) + демо-покупатели. */
export function buildUsers(): SeedRecord[] {
    const owners: SeedRecord[] = VENDORS.map((v) => ({
        collection: COLLECTIONS.users,
        key: { phone: v.ownerPhone },
        doc: {
            _id: vendorOwnerUserId(v.slug),
            role: 'vendor_owner',
            name: v.ownerName,
            phone: v.ownerPhone,
            phoneVerified: true,
            passwordHash: STUB_PASSWORD_HASH,
            lang: 'hy',
            status: 'active',
            vendorId: vendorId(v.slug),
            permissions: [
                'orders.view',
                'products.manage',
                'analytics.view',
                'chat.handle',
                'invoices.create',
            ],
            loyalty: { totalSpend: 0, totalOrders: 0 },
        },
    }));

    const buyers: SeedRecord[] = BUYERS.map((b) => ({
        collection: COLLECTIONS.users,
        key: { phone: b.phone },
        doc: {
            _id: buyerUserId(b.phone),
            role: 'buyer',
            accountType: 'individual',
            name: b.name,
            phone: b.phone,
            phoneVerified: true,
            passwordHash: STUB_PASSWORD_HASH,
            lang: b.lang,
            status: 'active',
            loyalty: { totalSpend: 0, totalOrders: 0 },
        },
    }));

    return [...owners, ...buyers];
}
