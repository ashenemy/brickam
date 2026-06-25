import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { SubscriptionPlan } from '../@types';

/**
 * Подписка вендора (Foundations §15, Stage 15). Коллекция `subscriptions`,
 * одна на вендора (`vendorId` — уникальный индекс). Без функциональных
 * ограничений — просто хранит активный тариф и дату его начала.
 */
@Schema(BASE_SCHEMA_OPTIONS)
export class Subscription extends BaseSchema {
    @Prop({ type: String, required: true, unique: true, index: true })
    vendorId!: string;

    @Prop({ type: String, enum: ['free', 'pro'], default: 'free' })
    plan!: SubscriptionPlan;

    @Prop({ type: Date, default: () => new Date() })
    since!: Date;
}

export type SubscriptionDocument = HydratedDocument<Subscription>;

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
