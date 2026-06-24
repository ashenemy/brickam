import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import type { LocalizedText, TemplateType } from '@brickam/domain-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

/** Вложенный мультиязычный текст (hy — дефолт). Под-схема для subject/content. */
@Schema({ _id: false })
export class LocalizedTextEmbedded implements LocalizedText {
    @Prop({ type: String, default: '' })
    hy!: string;

    @Prop({ type: String, default: '' })
    ru!: string;

    @Prop({ type: String, default: '' })
    en!: string;
}

const LocalizedTextSchema = SchemaFactory.createForClass(LocalizedTextEmbedded);

/**
 * Шаблон письма/SMS (Foundations §10/§15). Тексты уведомлений живут в БД, а не в
 * коде; рендерятся через TemplateRenderer с валидацией переменных по whitelist.
 */
@Schema(BASE_SCHEMA_OPTIONS)
export class Template extends BaseSchema {
    @Prop({ type: String, required: true, unique: true, index: true })
    key!: string;

    @Prop({ type: String, enum: ['email', 'sms'], required: true })
    type!: TemplateType;

    @Prop({ type: String, required: true })
    name!: string;

    @Prop({ type: LocalizedTextSchema, required: false })
    subject?: LocalizedText;

    @Prop({ type: LocalizedTextSchema, required: true })
    content!: LocalizedText;

    @Prop({ type: [String], default: [] })
    variables!: string[];

    @Prop({ type: Boolean, default: true })
    isActive!: boolean;

    @Prop({ type: Number, default: 1 })
    version!: number;

    @Prop({ type: String, required: false })
    updatedBy?: string;
}

export type TemplateDocument = HydratedDocument<Template>;

export const TemplateSchema = SchemaFactory.createForClass(Template);
