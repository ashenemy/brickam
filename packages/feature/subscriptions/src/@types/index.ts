/** Тариф подписки вендора. */
export type SubscriptionPlan = 'free' | 'pro';

/** Подписка вендора (публичный API-контракт). */
export type SubscriptionContract = {
    id: string;
    vendorId: string;
    plan: SubscriptionPlan;
    since: Date;
    createdAt: Date;
    updatedAt: Date;
};
