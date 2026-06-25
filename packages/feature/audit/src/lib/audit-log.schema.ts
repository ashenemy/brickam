import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

/**
 * Запись аудит-лога ключевого действия (Foundations §15, Stage 17, коллекция
 * `audit_logs`). Денормализованная неизменяемая запись: кто (actorId), что
 * (action) и над чем (targetType/targetId) сделал, с произвольным meta.
 */
@Schema({ ...BASE_SCHEMA_OPTIONS, collection: 'audit_logs' })
export class AuditLog extends BaseSchema {
    @Prop({ type: String, required: true, index: true })
    actorId!: string;

    @Prop({ type: String, required: true })
    action!: string;

    @Prop({ type: String, required: false })
    targetType?: string;

    @Prop({ type: String, required: false })
    targetId?: string;

    @Prop({ type: Object, required: false })
    meta?: Record<string, unknown>;

    @Prop({ type: Date, default: () => new Date() })
    at!: Date;
}

export type AuditLogDocument = HydratedDocument<AuditLog>;

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
