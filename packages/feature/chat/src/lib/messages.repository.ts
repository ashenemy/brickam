import type { Page, PaginationParams } from '@brickam/core-kit';
import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { HydratedDocument, Model } from 'mongoose';
import { Message, type MessageDocument } from './message.schema';

/** Репозиторий сообщений поверх Mongoose-модели Message (Foundations §7). */
@Injectable()
export class MessagesRepository extends BaseRepository<Message> {
    constructor(@InjectModel(Message.name) model: Model<Message>) {
        super(model);
    }

    /** Постраничный список сообщений чата (новые сверху). */
    findByChat(chatId: string, params: PaginationParams): Promise<Page<HydratedDocument<Message>>> {
        return this.findPaginated({ chatId }, params, { sort: { createdAt: -1 } });
    }

    /**
     * Помечает прочитанными сообщения чата, которые ещё не прочитаны
     * пользователем (добавляет userId в readBy). Возвращает число затронутых.
     */
    async markReadByUser(chatId: string, userId: string): Promise<number> {
        const result = await this.model
            .updateMany({ chatId, readBy: { $ne: userId } }, { $addToSet: { readBy: userId } })
            .exec();
        return result.modifiedCount;
    }

    /** Сообщения чата как HydratedDocument (без пагинации, новые сверху). */
    listByChat(chatId: string): Promise<MessageDocument[]> {
        return this.find({ chatId }, { sort: { createdAt: -1 } });
    }
}
