import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import { DeliveryStatus, type LocalizedText } from '@brickam/domain-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

/** Вложенный мультиязычный текст (hy — дефолт). Под-схема для titleSnapshot. */
@Schema({ _id: false })
class LocalizedTextEmbedded implements LocalizedText {
    @Prop({ type: String, default: '' })
    hy!: string;

    @Prop({ type: String, default: '' })
    ru!: string;

    @Prop({ type: String, default: '' })
    en!: string;
}

const LocalizedTextSchema = SchemaFactory.createForClass(LocalizedTextEmbedded);

/** Позиция саб-заказа вендора (после расчёта). */
@Schema({ _id: false })
class VendorOrderItem {
    @Prop({ type: String, required: true })
    productId!: string;

    @Prop({ type: LocalizedTextSchema, required: false })
    titleSnapshot?: LocalizedText;

    @Prop({ type: Number, required: true })
    qty!: number;

    @Prop({ type: Number, required: true })
    unitPrice!: number;

    @Prop({ type: Number, required: true })
    discountApplied!: number;

    @Prop({ type: Number, required: true })
    lineTotal!: number;
}

const VendorOrderItemSchema = SchemaFactory.createForClass(VendorOrderItem);

/** Событие изменения статуса доставки саб-заказа. */
@Schema({ _id: false })
class DeliveryEvent {
    @Prop({ type: String, enum: DeliveryStatus, required: true })
    status!: DeliveryStatus;

    @Prop({ type: Date, required: true })
    at!: Date;

    @Prop({ type: String, required: false })
    note?: string;
}

const DeliveryEventSchema = SchemaFactory.createForClass(DeliveryEvent);

/** Саб-заказ вендора (Foundations §15). Один на каждого вендора в заказе. */
@Schema(BASE_SCHEMA_OPTIONS)
export class VendorOrder extends BaseSchema {
    @Prop({ type: String, required: true, index: true })
    orderId!: string;

    @Prop({ type: String, required: true, index: true })
    vendorId!: string;

    @Prop({ type: [VendorOrderItemSchema], default: [] })
    items!: VendorOrderItem[];

    @Prop({ type: Number, required: true })
    subtotal!: number;

    @Prop({ type: Number, required: true })
    commissionPercentSnapshot!: number;

    @Prop({ type: Number, required: true })
    commissionAmount!: number;

    @Prop({ type: Number, required: true })
    payoutAmount!: number;

    @Prop({ type: String, enum: DeliveryStatus, default: DeliveryStatus.Accepted })
    deliveryStatus!: DeliveryStatus;

    @Prop({ type: [DeliveryEventSchema], default: [] })
    deliveryEvents!: DeliveryEvent[];
}

export type VendorOrderDocument = HydratedDocument<VendorOrder>;

export const VendorOrderSchema = SchemaFactory.createForClass(VendorOrder);
