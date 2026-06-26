import { BaseRepository } from '@brickam/db-kit';
import { PaymentStatus } from '@brickam/domain-kit';
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

    /**
     * Атомарно переводит платёж в Succeeded — только если он ещё НЕ Succeeded.
     * Возвращает обновлённый документ, либо `null`, если перехода не было (платёж
     * не найден или уже подтверждён). Защищает от гонки двух одновременных
     * вебхуков/возвратов PSP: фактический переход выполнит ровно один запрос.
     */
    markSucceeded(paymentId: string, providerRef: string): Promise<PaymentDocument | null> {
        return (this.model as unknown as Model<Payment>)
            .findOneAndUpdate(
                { _id: paymentId, status: { $ne: PaymentStatus.Succeeded } },
                { $set: { status: PaymentStatus.Succeeded, providerRef } },
                { new: true },
            )
            .exec() as Promise<PaymentDocument | null>;
    }
}
