import type { Page, PaginationParams } from '@brickam/core-kit';
import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { Order, type OrderDocument } from './order.schema';

/** Репозиторий заказов поверх Mongoose-модели Order (Foundations §7). */
@Injectable()
export class OrdersRepository extends BaseRepository<Order> {
    constructor(@InjectModel(Order.name) model: Model<Order>) {
        super(model);
    }

    /** Находит заказ по номеру (уникальный индекс). */
    findByNumber(orderNumber: string): Promise<OrderDocument | null> {
        return this.findOne({ orderNumber });
    }

    /** Постраничный список заказов покупателя (новые сверху). */
    findByBuyer(buyerId: string, params: PaginationParams): Promise<Page<HydratedDocument<Order>>> {
        return this.findPaginated({ buyerId }, params, { sort: { createdAt: -1 } });
    }
}
