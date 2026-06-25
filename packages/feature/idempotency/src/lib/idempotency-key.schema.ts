import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { IdempotencyStatus } from '../@types';

/**
 * Запись идемпотентного ключа (коллекция `idempotency_keys`). Уникальный
 * индекс по `key` гарантирует ровно одну операцию на ключ; `fingerprint`
 * (хеш метода/пути/тела) ловит повтор того же ключа с другим телом → 409.
 * Очистка по TTL-индексу на `expiresAt` (по умолчанию 24ч).
 */
@Schema(BASE_SCHEMA_OPTIONS)
export class IdempotencyKey extends BaseSchema {
    @Prop({ type: String, required: true, unique: true, index: true })
    key!: string;

    @Prop({ type: String, required: false })
    userId?: string;

    @Prop({ type: String, required: true })
    method!: string;

    @Prop({ type: String, required: true })
    path!: string;

    @Prop({ type: String, required: true })
    fingerprint!: string;

    @Prop({ type: String, enum: ['pending', 'completed'], default: 'pending' })
    status!: IdempotencyStatus;

    @Prop({ type: Number, required: false })
    statusCode?: number;

    @Prop({ type: Object, required: false })
    response?: unknown;

    // TTL-индекс: запись удаляется по достижении expiresAt (Foundations §7).
    @Prop({ type: Date, default: () => new Date(Date.now() + 86_400_000), index: { expires: 0 } })
    expiresAt!: Date;
}

export type IdempotencyKeyDocument = HydratedDocument<IdempotencyKey>;

export const IdempotencyKeySchema = SchemaFactory.createForClass(IdempotencyKey);
