import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { WishlistItem } from '../@types';

/** Вложенная позиция вишлиста (товар + момент добавления). */
@Schema({ _id: false })
export class WishlistItemEmbedded implements WishlistItem {
    @Prop({ type: String, required: true })
    productId!: string;

    @Prop({ type: Date, default: () => new Date() })
    addedAt!: Date;
}

const WishlistItemSchema = SchemaFactory.createForClass(WishlistItemEmbedded);

/**
 * Вишлист пользователя (Foundations §15). Один документ на пользователя
 * (`userId` — уникальный индекс); позиции хранятся как массив под-схемы.
 */
@Schema(BASE_SCHEMA_OPTIONS)
export class Wishlist extends BaseSchema {
    @Prop({ type: String, required: true, unique: true, index: true })
    userId!: string;

    @Prop({ type: [WishlistItemSchema], default: [] })
    items!: WishlistItem[];
}

export type WishlistDocument = HydratedDocument<Wishlist>;

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);
