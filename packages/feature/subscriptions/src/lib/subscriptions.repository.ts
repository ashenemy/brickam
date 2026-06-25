import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Subscription, type SubscriptionDocument } from './subscription.schema';

/** Репозиторий подписок вендоров (Foundations §7). */
@Injectable()
export class SubscriptionsRepository extends BaseRepository<Subscription> {
    constructor(@InjectModel(Subscription.name) model: Model<Subscription>) {
        super(model);
    }

    /** Подписка вендора (уникальный индекс vendorId). */
    findByVendor(vendorId: string): Promise<SubscriptionDocument | null> {
        return this.findOne({ vendorId });
    }
}
