import { Injectable } from '@nestjs/common';
import type { SubscriptionContract, SubscriptionPlan } from '../@types';
import type { SubscriptionDocument } from './subscription.schema';
import { SubscriptionsRepository } from './subscriptions.repository';

/**
 * Сервис подписок вендоров (Foundations §15, Stage 15). Хранит активный тариф
 * вендора (free по умолчанию). Без функциональных ограничений — фактический
 * гейтинг возможностей по тарифу делают потребители. Границы feature: kit/domain.
 */
@Injectable()
export class SubscriptionsService {
    constructor(private readonly subscriptionsRepository: SubscriptionsRepository) {}

    /** Маппит документ подписки в плоский контракт. */
    private toContract(doc: SubscriptionDocument): SubscriptionContract {
        return {
            id: doc.id ?? doc._id.toString(),
            vendorId: doc.vendorId,
            plan: doc.plan,
            since: doc.since,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
    }

    /** Возвращает подписку вендора, создавая free-подписку при первом обращении. */
    async getOrCreate(vendorId: string): Promise<SubscriptionContract> {
        const existing = await this.subscriptionsRepository.findByVendor(vendorId);
        if (existing) {
            return this.toContract(existing);
        }
        const created = await this.subscriptionsRepository.create({
            vendorId,
            plan: 'free',
            since: new Date(),
        });
        return this.toContract(created);
    }

    /** Меняет тариф вендора (создаёт подписку, если её ещё нет). */
    async setPlan(vendorId: string, plan: SubscriptionPlan): Promise<SubscriptionContract> {
        const existing = await this.subscriptionsRepository.findByVendor(vendorId);
        if (!existing) {
            const created = await this.subscriptionsRepository.create({
                vendorId,
                plan,
                since: new Date(),
            });
            return this.toContract(created);
        }
        const updated = await this.subscriptionsRepository.updateById(existing.id, {
            plan,
            since: new Date(),
        });
        // updateById вернёт документ (existing гарантированно есть).
        return this.toContract(updated as SubscriptionDocument);
    }
}
