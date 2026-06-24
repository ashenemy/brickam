import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Chat, type ChatDocument } from './chat.schema';

/** Репозиторий чатов поверх Mongoose-модели Chat (Foundations §7). */
@Injectable()
export class ChatsRepository extends BaseRepository<Chat> {
    constructor(@InjectModel(Chat.name) model: Model<Chat>) {
        super(model);
    }

    /** Находит чат по паре покупатель/вендор (индекс {buyerId, vendorId}). */
    findBetween(buyerId: string, vendorId: string): Promise<ChatDocument | null> {
        return this.findOne({ buyerId, vendorId });
    }

    /** Чаты покупателя (новые по последнему сообщению сверху). */
    listForUser(userId: string): Promise<ChatDocument[]> {
        return this.find({ buyerId: userId }, { sort: { lastMessageAt: -1, createdAt: -1 } });
    }

    /** Чаты вендора (новые по последнему сообщению сверху). */
    listForVendor(vendorId: string): Promise<ChatDocument[]> {
        return this.find({ vendorId }, { sort: { lastMessageAt: -1, createdAt: -1 } });
    }
}
