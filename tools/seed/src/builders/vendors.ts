import { COLLECTIONS, type SeedRecord } from '../types';

/** Стабильные id вендора и его владельца. */
export const vendorId = (slug: string): string => `vendor_${slug}`;
export const vendorOwnerUserId = (slug: string): string => `user_owner_${slug}`;

export type VendorSeed = {
    slug: string;
    name: string;
    legalName: string;
    region: string;
    city: string;
    ownerName: string;
    ownerPhone: string;
};

/** 8 вендоров с реалистичными армянскими названиями. */
export const VENDORS: VendorSeed[] = [
    {
        slug: 'shin-market',
        name: 'Շին Մարկետ',
        legalName: 'ՍՊԸ «Շին Մարկետ»',
        region: 'Yerevan',
        city: 'Yerevan',
        ownerName: 'Արամ Հակոբյան',
        ownerPhone: '+37491100001',
    },
    {
        slug: 'erevan-stroy',
        name: 'Ереван Строй',
        legalName: 'ООО «Ереван Строй»',
        region: 'Yerevan',
        city: 'Yerevan',
        ownerName: 'Геворг Саркисян',
        ownerPhone: '+37491100002',
    },
    {
        slug: 'ararat-shinanyut',
        name: 'Արարատ Շինանյութ',
        legalName: 'ՍՊԸ «Արարատ Շինանյութ»',
        region: 'Ararat',
        city: 'Artashat',
        ownerName: 'Տիգրան Պետրոսյան',
        ownerPhone: '+37491100003',
    },
    {
        slug: 'kashen-build',
        name: 'Кашен Билд',
        legalName: 'ООО «Кашен Билд»',
        region: 'Kotayk',
        city: 'Abovyan',
        ownerName: 'Давид Григорян',
        ownerPhone: '+37491100004',
    },
    {
        slug: 'gyumri-shin',
        name: 'Գյումրի Շին',
        legalName: 'ՍՊԸ «Գյումրի Շին»',
        region: 'Shirak',
        city: 'Gyumri',
        ownerName: 'Սմբատ Մկրտչյան',
        ownerPhone: '+37491100005',
    },
    {
        slug: 'masis-materials',
        name: 'Մասիս Շինանյութ',
        legalName: 'ՍՊԸ «Մասիս Շինանյութ»',
        region: 'Ararat',
        city: 'Masis',
        ownerName: 'Վահան Ավագյան',
        ownerPhone: '+37491100006',
    },
    {
        slug: 'vanadzor-prof',
        name: 'Վանաձոր Պրոֆ',
        legalName: 'ՍՊԸ «Վանաձոր Պրոֆ»',
        region: 'Lori',
        city: 'Vanadzor',
        ownerName: 'Կարեն Ստեփանյան',
        ownerPhone: '+37491100007',
    },
    {
        slug: 'remont-plus',
        name: 'Ремонт Плюс',
        legalName: 'ООО «Ремонт Плюс»',
        region: 'Yerevan',
        city: 'Yerevan',
        ownerName: 'Армен Назарян',
        ownerPhone: '+37491100008',
    },
];

/**
 * Документы вендоров. ratingAvg/ratingCount проставляются нулём здесь и
 * пересчитываются билдером отзывов (согласованно с reviews).
 */
export function buildVendors(): SeedRecord[] {
    return VENDORS.map((v) => ({
        collection: COLLECTIONS.vendors,
        key: { slug: v.slug },
        doc: {
            _id: vendorId(v.slug),
            slug: v.slug,
            name: v.name,
            legalName: v.legalName,
            status: 'active',
            ownerUserId: vendorOwnerUserId(v.slug),
            region: v.region,
            city: v.city,
            logo: `https://cdn.brickam.am/vendors/${v.slug}/logo.png`,
            ratingAvg: 0,
            ratingCount: 0,
        },
    }));
}
