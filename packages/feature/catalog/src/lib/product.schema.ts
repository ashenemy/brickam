import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import type { LocalizedText } from '@brickam/domain-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type {
    Discount,
    MediaDescriptor,
    MediaType,
    ProductAttribute,
    ProductStatus,
} from '../@types';

/** Вложенный мультиязычный текст (hy — дефолт). Под-схема для title/description. */
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

/** Вложенный дескриптор медиа (обложка/галерея). */
@Schema({ _id: false })
class MediaEmbedded implements MediaDescriptor {
    @Prop({ type: String, enum: ['image', 'video'], required: true })
    mediaType!: MediaType;

    @Prop({ type: String, required: true })
    url!: string;

    @Prop({ type: String, required: false })
    thumbnailUrl?: string;
}

const MediaSchema = SchemaFactory.createForClass(MediaEmbedded);

/** Вложенная скидка. */
@Schema({ _id: false })
class DiscountEmbedded implements Discount {
    @Prop({ type: String, enum: ['percent', 'amount'], required: true })
    type!: 'percent' | 'amount';

    @Prop({ type: Number, required: true })
    value!: number;

    @Prop({ type: Date, required: false })
    activeFrom?: Date;

    @Prop({ type: Date, required: false })
    activeTo?: Date;
}

const DiscountSchema = SchemaFactory.createForClass(DiscountEmbedded);

/** Вложенный атрибут товара (ключ-значение). */
@Schema({ _id: false })
class AttributeEmbedded implements ProductAttribute {
    @Prop({ type: String, required: true })
    key!: string;

    @Prop({ type: String, required: true })
    value!: string;
}

const AttributeSchema = SchemaFactory.createForClass(AttributeEmbedded);

/**
 * Товар (Foundations §13/§15). Только продажа (без аренды). embedding не
 * заполняется здесь — векторизация выполняется на Stage 13.
 */
@Schema(BASE_SCHEMA_OPTIONS)
export class Product extends BaseSchema {
    @Prop({ type: String, required: true, index: true })
    vendorId!: string;

    @Prop({ type: String, required: true, index: true })
    categoryId!: string;

    @Prop({ type: String, required: true, unique: true, index: true })
    slug!: string;

    @Prop({ type: LocalizedTextSchema, required: true })
    title!: LocalizedText;

    @Prop({ type: LocalizedTextSchema, required: true })
    description!: LocalizedText;

    @Prop({ type: MediaSchema, required: true })
    cover!: MediaDescriptor;

    @Prop({ type: [MediaSchema], default: [] })
    gallery!: MediaDescriptor[];

    @Prop({ type: Number, required: true })
    price!: number;

    @Prop({ type: DiscountSchema, required: false })
    discount?: Discount;

    @Prop({ type: String, required: true })
    unit!: string;

    @Prop({ type: Number, default: 0 })
    stock!: number;

    @Prop({ type: String, required: true })
    region!: string;

    @Prop({ type: String, enum: ['draft', 'active', 'hidden'], default: 'draft' })
    status!: ProductStatus;

    @Prop({ type: [AttributeSchema], default: [] })
    attributes!: ProductAttribute[];

    @Prop({ type: [Number], required: false })
    embedding?: number[];

    @Prop({ type: Number, default: 0 })
    ratingAvg!: number;

    @Prop({ type: Number, default: 0 })
    ratingCount!: number;

    @Prop({ type: Number, default: 0 })
    viewsCount!: number;
}

export type ProductDocument = HydratedDocument<Product>;

export const ProductSchema = SchemaFactory.createForClass(Product);

// Полнотекстовый индекс по мультиязычным title/description (Foundations §13).
ProductSchema.index({
    'title.hy': 'text',
    'title.ru': 'text',
    'title.en': 'text',
    'description.hy': 'text',
    'description.ru': 'text',
    'description.en': 'text',
});
