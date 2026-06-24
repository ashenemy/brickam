import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

/**
 * Настройки платформы (коллекция platform_settings). Произвольный JSON value по
 * уникальному ключу; scope группирует настройки (например 'media').
 */
@Schema({ ...BASE_SCHEMA_OPTIONS, collection: 'platform_settings' })
export class PlatformSettings extends BaseSchema {
    @Prop({ type: String, required: true, unique: true, index: true })
    key!: string;

    @Prop({ type: Object, required: true })
    value!: Record<string, unknown>;

    @Prop({ type: String, required: false })
    scope?: string;
}

export type PlatformSettingsDocument = HydratedDocument<PlatformSettings>;

export const PlatformSettingsSchema = SchemaFactory.createForClass(PlatformSettings);
