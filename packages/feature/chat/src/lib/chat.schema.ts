import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { ChatParticipant, ChatUnread } from '../@types';

/** Участник чата (под-схема): id пользователя/вендора и его роль в чате. */
@Schema({ _id: false })
class ChatParticipantEmbedded implements ChatParticipant {
    @Prop({ type: String, required: true })
    userId!: string;

    @Prop({ type: String, enum: ['buyer', 'vendor'], required: true })
    role!: 'buyer' | 'vendor';
}

const ChatParticipantSchema = SchemaFactory.createForClass(ChatParticipantEmbedded);

/** Счётчики непрочитанных по сторонам (под-схема, дефолты 0). */
@Schema({ _id: false })
class ChatUnreadEmbedded implements ChatUnread {
    @Prop({ type: Number, default: 0 })
    buyer!: number;

    @Prop({ type: Number, default: 0 })
    vendor!: number;
}

const ChatUnreadSchema = SchemaFactory.createForClass(ChatUnreadEmbedded);

/**
 * Чат покупателя (`buyerId`) с вендором (`vendorId` — id сущности вендора)
 * (Foundations §15, Stage 8). Один чат на пару buyer/vendor (индекс по паре).
 */
@Schema(BASE_SCHEMA_OPTIONS)
export class Chat extends BaseSchema {
    @Prop({ type: String, required: true })
    buyerId!: string;

    @Prop({ type: String, required: true })
    vendorId!: string;

    @Prop({ type: [ChatParticipantSchema], default: [] })
    participants!: ChatParticipant[];

    @Prop({ type: Date, required: false })
    lastMessageAt?: Date;

    @Prop({ type: ChatUnreadSchema, default: () => ({ buyer: 0, vendor: 0 }) })
    unread!: ChatUnread;
}

export type ChatDocument = HydratedDocument<Chat>;

export const ChatSchema = SchemaFactory.createForClass(Chat);

ChatSchema.index({ buyerId: 1, vendorId: 1 });
