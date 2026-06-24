import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { VendorOrder, type VendorOrderDocument } from './vendor-order.schema';

/** Репозиторий саб-заказов вендоров поверх Mongoose-модели (Foundations §7). */
@Injectable()
export class VendorOrdersRepository extends BaseRepository<VendorOrder> {
    constructor(@InjectModel(VendorOrder.name) model: Model<VendorOrder>) {
        super(model);
    }

    /** Все саб-заказы по заказу. */
    findByOrder(orderId: string): Promise<VendorOrderDocument[]> {
        return this.find({ orderId });
    }
}
