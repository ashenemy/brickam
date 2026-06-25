import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { VendorStatus } from '../@types';

/**
 * Вендор (Foundations §15, Stage 15). Коллекция `vendors`. `slug` — уникальный
 * человекочитаемый идентификатор для публичного профиля; `ownerUserId` — владелец
 * (роль vendor_owner). Рейтинг денормализуется из reviews (recomputeRating).
 */
@Schema(BASE_SCHEMA_OPTIONS)
export class Vendor extends BaseSchema {
    @Prop({ type: String, required: true, unique: true, index: true })
    slug!: string;

    @Prop({ type: String, required: true })
    name!: string;

    @Prop({ type: String, required: false })
    display?: string;

    @Prop({ type: String, required: true, index: true })
    ownerUserId!: string;

    @Prop({ type: String, required: true })
    region!: string;

    @Prop({ type: String, required: false })
    city?: string;

    @Prop({ type: String, enum: ['active', 'suspended'], default: 'active' })
    status!: VendorStatus;

    @Prop({ type: Number, default: 0 })
    ratingAvg!: number;

    @Prop({ type: Number, default: 0 })
    ratingCount!: number;

    @Prop({ type: String, required: false })
    logo?: string;
}

export type VendorDocument = HydratedDocument<Vendor>;

export const VendorSchema = SchemaFactory.createForClass(Vendor);
