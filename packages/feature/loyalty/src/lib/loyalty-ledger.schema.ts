import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import type { LoyaltyBasis } from '@brickam/domain-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

/**
 * Журнал начислений лояльности (Foundations §11, §15). Каждая запись фиксирует
 * прирост метрики покупателя при завершении заказа и текущий уровень после него.
 */
@Schema(BASE_SCHEMA_OPTIONS)
export class LoyaltyLedger extends BaseSchema {
    @Prop({ type: String, required: true, index: true })
    userId!: string;

    @Prop({ type: String, required: false })
    orderId?: string;

    @Prop({ type: String, enum: ['total_spend', 'order_count'], required: true })
    basis!: LoyaltyBasis;

    @Prop({ type: Number, required: true })
    delta!: number;

    @Prop({ type: String, required: false })
    tierId?: string;

    @Prop({ type: Date, default: () => new Date() })
    at!: Date;
}

export type LoyaltyLedgerDocument = HydratedDocument<LoyaltyLedger>;

export const LoyaltyLedgerSchema = SchemaFactory.createForClass(LoyaltyLedger);
