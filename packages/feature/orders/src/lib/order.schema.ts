import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import { OrderStatus } from '@brickam/domain-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { DeliveryAddressSnapshot } from '../@types';

/** Снимок адреса доставки внутри заказа. */
@Schema({ _id: false })
class DeliveryAddressSnapshotEmbedded implements DeliveryAddressSnapshot {
    @Prop({ type: String, required: true })
    label!: string;

    @Prop({ type: String, required: true })
    region!: string;

    @Prop({ type: String, required: true })
    city!: string;

    @Prop({ type: String, required: true })
    line1!: string;

    @Prop({ type: String, required: false })
    line2?: string;

    @Prop({ type: String, required: true })
    phone!: string;
}

const DeliveryAddressSnapshotSchema = SchemaFactory.createForClass(DeliveryAddressSnapshotEmbedded);

/** Заказ покупателя (Foundations §15). Эскроу нет — оплата обычным платежом. */
@Schema(BASE_SCHEMA_OPTIONS)
export class Order extends BaseSchema {
    @Prop({ type: String, required: true, unique: true, index: true })
    orderNumber!: string;

    @Prop({ type: String, required: true, index: true })
    buyerId!: string;

    @Prop({ type: String, enum: OrderStatus, default: OrderStatus.Created })
    status!: OrderStatus;

    @Prop({ type: Number, required: true })
    subtotal!: number;

    @Prop({ type: Number, required: true })
    productDiscountTotal!: number;

    @Prop({ type: Number, default: 0 })
    loyaltyDiscount!: number;

    @Prop({ type: Number, required: true })
    total!: number;

    @Prop({ type: String, required: true })
    currencyShown!: string;

    @Prop({ type: String, required: false })
    paymentId?: string;

    @Prop({ type: DeliveryAddressSnapshotSchema, required: true })
    deliveryAddressSnapshot!: DeliveryAddressSnapshot;

    @Prop({ type: String, required: false })
    loyaltyTierSnapshot?: string;
}

export type OrderDocument = HydratedDocument<Order>;

export const OrderSchema = SchemaFactory.createForClass(Order);
