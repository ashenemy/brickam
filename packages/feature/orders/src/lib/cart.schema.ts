import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import type { DiscountInput } from '@brickam/domain-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

/** Вложенная скидка-снимок позиции корзины. */
@Schema({ _id: false })
class CartDiscountEmbedded implements DiscountInput {
    @Prop({ type: String, required: true })
    type!: 'percent' | 'amount';

    @Prop({ type: Number, required: true })
    value!: number;

    @Prop({ type: Date, required: false })
    activeFrom?: Date;

    @Prop({ type: Date, required: false })
    activeTo?: Date;
}

const CartDiscountSchema = SchemaFactory.createForClass(CartDiscountEmbedded);

/** Позиция корзины со снимком цены/скидки/vendorId на момент добавления. */
@Schema({ _id: false })
class CartItem {
    @Prop({ type: String, required: true })
    productId!: string;

    @Prop({ type: String, required: true })
    vendorId!: string;

    @Prop({ type: Number, required: true })
    qty!: number;

    @Prop({ type: Number, required: true })
    priceSnapshot!: number;

    @Prop({ type: CartDiscountSchema, required: false })
    discountSnapshot?: DiscountInput;
}

const CartItemSchema = SchemaFactory.createForClass(CartItem);

/** Корзина покупателя (Foundations §15). Одна корзина на покупателя. */
@Schema(BASE_SCHEMA_OPTIONS)
export class Cart extends BaseSchema {
    @Prop({ type: String, required: true, unique: true, index: true })
    buyerId!: string;

    @Prop({ type: [CartItemSchema], default: [] })
    items!: CartItem[];
}

export type CartDocument = HydratedDocument<Cart>;

export const CartSchema = SchemaFactory.createForClass(Cart);
