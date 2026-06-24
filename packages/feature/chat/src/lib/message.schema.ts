import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { MessageType } from '../@types';

/**
 * Сообщение чата (Foundations §15, Stage 8). createdAt даёт timestamps.
 * `readBy` — список userId, прочитавших сообщение (для расчёта непрочитанных).
 */
@Schema(BASE_SCHEMA_OPTIONS)
export class Message extends BaseSchema {
    @Prop({ type: String, required: true, index: true })
    chatId!: string;

    @Prop({ type: String, required: true })
    senderId!: string;

    @Prop({ type: String, enum: ['text', 'invoice', 'file', 'system'], default: 'text' })
    type!: MessageType;

    @Prop({ type: String, required: false })
    text?: string;

    @Prop({ type: String, required: false })
    attachmentUrl?: string;

    @Prop({ type: String, required: false })
    invoiceId?: string;

    @Prop({ type: [String], default: [] })
    readBy!: string[];
}

export type MessageDocument = HydratedDocument<Message>;

export const MessageSchema = SchemaFactory.createForClass(Message);
