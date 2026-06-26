import { ChatServiceContract } from '@brickam/domain-kit';
import { Global, Module } from '@nestjs/common';
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
 * Масштабирование (несколько инстансов): Redis-adapter Socket.IO подключается
 * в bootstrap (setupWsRedisAdapter в apps/server) — авто в проде или при
 * WS_REDIS_ADAPTER=1; в dev/тестах — встроенный in-memory адаптер Socket.IO.
 */
@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Chat.name, schema: ChatSchema },
            { name: Message.name, schema: MessageSchema },
        ]),
    ],
    controllers: [ChatController],
    providers: [
        ChatsRepository,
        MessagesRepository,
        ChatService,
        ChatGateway,
        // Контракт для invoices: постинг инвойс-сообщения в чат.
        { provide: ChatServiceContract, useExisting: ChatService },
    ],
    exports: [ChatService, ChatGateway, ChatServiceContract],
})
export class ChatModule {}
