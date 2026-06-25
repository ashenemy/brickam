import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import type { LoyaltyBasis } from '@brickam/domain-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { LoyaltyDiscountType } from '../@types';

/**
 * Уровень программы лояльности (под-схема). Текущий уровень покупателя — макс.
 * tier, чей `threshold ≤ метрика` (по basis). Скидку несёт платформа.
 */
@Schema({ _id: false })
export class LoyaltyTier {
    @Prop({ type: Number, required: true })
    level!: number;

    @Prop({ type: String, required: true })
    name!: string;

    @Prop({ type: Number, required: true, min: 0 })
    threshold!: number;

    @Prop({ type: String, enum: ['percent', 'amount'], required: true })
    discountType!: LoyaltyDiscountType;

    @Prop({ type: Number, required: true, min: 0 })
    discountValue!: number;
}

export const LoyaltyTierSchema = SchemaFactory.createForClass(LoyaltyTier);

/**
 * Программа лояльности (Foundations §11, §15). Уровни и скидки задаются
 * платформой; одновременно активна одна программа (`active: true`).
 */
@Schema(BASE_SCHEMA_OPTIONS)
export class LoyaltyProgram extends BaseSchema {
    @Prop({ type: String, enum: ['total_spend', 'order_count'], required: true })
    basis!: LoyaltyBasis;

    @Prop({ type: Boolean, default: true })
    active!: boolean;

    @Prop({ type: [LoyaltyTierSchema], default: [] })
    tiers!: LoyaltyTier[];
}

export type LoyaltyProgramDocument = HydratedDocument<LoyaltyProgram>;

export const LoyaltyProgramSchema = SchemaFactory.createForClass(LoyaltyProgram);
