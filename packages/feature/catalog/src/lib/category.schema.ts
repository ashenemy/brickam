import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import type { LocalizedText } from '@brickam/domain-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

/** Вложенный мультиязычный текст (hy — дефолт). Под-схема для name. */
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

/**
 * Категория каталога (Foundations §13/§15). Дерево через parentId; порядок
 * вывода — order; calculatorType связывает категорию с типом калькулятора.
 */
@Schema(BASE_SCHEMA_OPTIONS)
export class Category extends BaseSchema {
    @Prop({ type: String, required: true, unique: true, index: true })
    slug!: string;

    @Prop({ type: String, required: false })
    parentId?: string;

    @Prop({ type: LocalizedTextSchema, required: true })
    name!: LocalizedText;

    @Prop({ type: String, required: false })
    icon?: string;

    @Prop({ type: String, required: false })
    calculatorType?: string;

    /** Обложка категории (data-URI/S3-URL) — для витрины/главной. */
    @Prop({ type: String, required: false })
    coverUrl?: string;

    /** Показывать категорию в блоке «Shop by room» на главной. */
    @Prop({ type: Boolean, default: false })
    featuredOnHome?: boolean;

    @Prop({ type: Number, default: 0 })
    order!: number;
}

export type CategoryDocument = HydratedDocument<Category>;

export const CategorySchema = SchemaFactory.createForClass(Category);
