import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import type { AiJobStatus, AiJobType } from '@brickam/domain-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { AiJobResult } from '../@types';

/**
 * AI-задача ассистента продавца (Foundations §13/§15, коллекция `ai_jobs`).
 * Промпт-управляемая асинхронная генерация (описание/картинка/видео) с
 * прогрессом: queued → processing → done/failed. Итоговый промпт (finalPrompt)
 * собирается в процессоре из базового шаблона + промпта продавца + контекста
 * товара. result зависит от типа: description → {text}, image/video → {url}.
 */
@Schema({ ...BASE_SCHEMA_OPTIONS, collection: 'ai_jobs' })
export class AiJob extends BaseSchema {
    @Prop({ type: String, required: true, index: true })
    vendorId!: string;

    @Prop({ type: String, required: false, index: true })
    productId?: string;

    @Prop({ type: String, enum: ['description', 'image', 'video'], required: true })
    type!: AiJobType;

    @Prop({
        type: String,
        enum: ['queued', 'processing', 'done', 'failed'],
        default: 'queued',
    })
    status!: AiJobStatus;

    @Prop({ type: String, required: true })
    userPrompt!: string;

    @Prop({ type: String, required: false })
    finalPrompt?: string;

    @Prop({ type: Number, default: 0, min: 0, max: 100 })
    progress!: number;

    @Prop({ type: Object, required: false })
    result?: AiJobResult;

    @Prop({ type: String, required: false })
    error?: string;
}

export type AiJobDocument = HydratedDocument<AiJob>;

export const AiJobSchema = SchemaFactory.createForClass(AiJob);
