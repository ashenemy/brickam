import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { DeliveryAddress, type DeliveryAddressDocument } from './delivery-address.schema';

/** Репозиторий адресов доставки поверх Mongoose-модели (Foundations §7). */
@Injectable()
export class DeliveryAddressesRepository extends BaseRepository<DeliveryAddress> {
    constructor(@InjectModel(DeliveryAddress.name) model: Model<DeliveryAddress>) {
        super(model);
    }

    /** Все адреса доставки пользователя. */
    findByUser(userId: string): Promise<DeliveryAddressDocument[]> {
        return this.find({ userId });
    }
}
