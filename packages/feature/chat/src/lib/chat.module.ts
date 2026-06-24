import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { Chat, ChatSchema } from './chat.schema';
import { ChatService } from './chat.service';
import { ChatsRepository } from './chats.repository';
import { Message, MessageSchema } from './message.schema';
import { MessagesRepository } from './messages.repository';

/**
 * Модуль чата (Foundations §15, Stage 8). НЕ @Global. TokenVerifierContract
 * приходит глобально из auth (@Global) — инжектится по токену, auth не
 * импортируется. Зависит только от kit/domain (граница feature).
 *
 * TODO(масштабирование): для нескольких инстансов подключить Redis-adapter
 * (config.queue.redisUrl) через @socket.io/redis-adapter в bootstrap; по
 * умолчанию используется встроенный in-memory адаптер Socket.IO.
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Chat.name, schema: ChatSchema },
            { name: Message.name, schema: MessageSchema },
        ]),
    ],
    controllers: [ChatController],
    providers: [ChatsRepository, MessagesRepository, ChatService, ChatGateway],
    exports: [ChatService, ChatGateway],
})
export class ChatModule {}
