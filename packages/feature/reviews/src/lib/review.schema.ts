import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { ReviewStatus } from '../@types';

/**
 * Отзыв по саб-заказу вендора (Foundations §15, Stage 7). Один отзыв на
 * vendor_order (`vendorOrderId` — уникальный индекс). Привязки orderId/
 * vendorId/productId денормализованы из vendor_order для пересчёта агрегатов.
 */
@Schema(BASE_SCHEMA_OPTIONS)
export class Review extends BaseSchema {
    @Prop({ type: String, required: true })
    orderId!: string;

    @Prop({ type: String, required: true, unique: true, index: true })
    vendorOrderId!: string;

    @Prop({ type: String, required: true })
    buyerId!: string;

    @Prop({ type: String, required: true, index: true })
    vendorId!: string;

    @Prop({ type: String, required: false, index: true })
    productId?: string;

    @Prop({ type: Number, required: true, min: 1, max: 5 })
    rating!: number;

    @Prop({ type: String, required: true })
    text!: string;

    @Prop({ type: String, enum: ['published', 'hidden'], default: 'published' })
    status!: ReviewStatus;
}

export type ReviewDocument = HydratedDocument<Review>;

export const ReviewSchema = SchemaFactory.createForClass(Review);
