import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Payment, type PaymentDocument } from './payment.schema';

/** Репозиторий платежей поверх Mongoose-модели Payment (Foundations §7). */
@Injectable()
export class PaymentsRepository extends BaseRepository<Payment> {
    constructor(@InjectModel(Payment.name) model: Model<Payment>) {
        super(model);
    }

    /** Находит платёж по заказу (один платёж на заказ). */
    findByOrder(orderId: string): Promise<PaymentDocument | null> {
        return this.findOne({ orderId });
    }

    /** Находит платёж по идентификатору транзакции провайдера. */
    findByProviderRef(providerRef: string): Promise<PaymentDocument | null> {
        return this.findOne({ providerRef });
    }
}
