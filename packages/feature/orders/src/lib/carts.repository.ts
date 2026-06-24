import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Cart, type CartDocument } from './cart.schema';

/** Репозиторий корзин поверх Mongoose-модели Cart (Foundations §7). */
@Injectable()
export class CartsRepository extends BaseRepository<Cart> {
    constructor(@InjectModel(Cart.name) model: Model<Cart>) {
        super(model);
    }

    /** Находит корзину покупателя (уникальный индекс buyerId). */
    findByBuyer(buyerId: string): Promise<CartDocument | null> {
        return this.findOne({ buyerId });
    }
}
