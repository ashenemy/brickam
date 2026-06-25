/** Статус вендора. `pending` — на модерации; `suspended` — отключён платформой. */
export type VendorStatus = 'pending' | 'active' | 'suspended';

/** Вендор (публичный API-контракт, без Mongoose-документа). */
export type VendorContract = {
    id: string;
    slug: string;
    name: string;
    display?: string;
    ownerUserId: string;
    region: string;
    city?: string;
    status: VendorStatus;
    ratingAvg: number;
    ratingCount: number;
    logo?: string;
    createdAt: Date;
    updatedAt: Date;
};
