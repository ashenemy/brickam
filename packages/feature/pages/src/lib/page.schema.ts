import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import type { LocalizedText } from '@brickam/domain-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { PageStatus } from '../@types';

/** Вложенный мультиязычный текст (hy — дефолт). Под-схема для title/content/seo. */
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
 * Статическая CMS-страница (Foundations §15). Идентифицируется уникальным slug
 * (about/privacy/terms и т.п.). content — markdown/html строка по локали.
 * Публичное чтение отдаёт только опубликованные (`published`) страницы.
 */
@Schema(BASE_SCHEMA_OPTIONS)
export class Page extends BaseSchema {
    @Prop({ type: String, required: true, unique: true, index: true })
    slug!: string;

    @Prop({ type: LocalizedTextSchema, required: true })
    title!: LocalizedText;

    @Prop({ type: LocalizedTextSchema, required: true })
    content!: LocalizedText;

    @Prop({ type: String, enum: ['draft', 'published'], default: 'draft' })
    status!: PageStatus;

    @Prop({ type: LocalizedTextSchema, required: false })
    seoTitle?: LocalizedText;

    @Prop({ type: LocalizedTextSchema, required: false })
    seoDescription?: LocalizedText;
}

export type PageDocument = HydratedDocument<Page>;

export const PageSchema = SchemaFactory.createForClass(Page);
