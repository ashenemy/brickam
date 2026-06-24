import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

/** Адрес доставки пользователя (Foundations §15). */
@Schema(BASE_SCHEMA_OPTIONS)
export class DeliveryAddress extends BaseSchema {
    @Prop({ type: String, required: true, index: true })
    userId!: string;

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

    @Prop({ type: Boolean, default: false })
    isDefault!: boolean;
}

export type DeliveryAddressDocument = HydratedDocument<DeliveryAddress>;

export const DeliveryAddressSchema = SchemaFactory.createForClass(DeliveryAddress);
