import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { DisputeStatus } from '../@types';

/**
 * Спор по заказу (Foundations §15, Stage 17, коллекция `disputes`). Открывает
 * покупатель/участник, разбирает админ. Жизненный цикл статуса:
 * open → reviewing → resolved (resolve допустим и напрямую из open).
 */
@Schema({ ...BASE_SCHEMA_OPTIONS, collection: 'disputes' })
export class Dispute extends BaseSchema {
    @Prop({ type: String, required: true, index: true })
    orderId!: string;

    @Prop({ type: String, required: false })
    vendorOrderId?: string;

    @Prop({ type: String, required: true })
    openedByUserId!: string;

    @Prop({ type: String, required: true, index: true })
    vendorId!: string;

    @Prop({ type: String, required: true })
    reason!: string;

    @Prop({ type: String, enum: ['open', 'reviewing', 'resolved'], default: 'open', index: true })
    status!: DisputeStatus;

    @Prop({ type: String, required: false })
    resolution?: string;

    @Prop({ type: Date, default: () => new Date() })
    at!: Date;
}

export type DisputeDocument = HydratedDocument<Dispute>;

export const DisputeSchema = SchemaFactory.createForClass(Dispute);
