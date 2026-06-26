import { AppConfigService } from '@brickam/config-kit';
import type { JwtPayload } from '@brickam/domain-kit';
import { TokenVerifierContract } from '@brickam/domain-kit';
import {
    type OnGatewayConnection,
    type OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { MessageView, SendMessagePayload } from '../@types';
import { ChatService } from './chat.service';

/** Полезная нагрузка события chat:join / message:read. */
type ChatRef = { chatId: string };

/** Полезная нагрузка события message:send. */
type SendPayload = ChatRef & SendMessagePayload;

/** Формат ack (ok-ответ либо ошибка). */
type Ack<TData = unknown> = { ok: true; data?: TData } | { error: string };

/**
 * WS-шлюз чата (Foundations §15, Stage 8), namespace `/chat`. Аутентификация
 * на connection через TokenVerifierContract (auth не импортируется напрямую).
 * Ошибки доступа возвращаются в ack, сокет не роняется.
 *
 * Масштабирование (несколько инстансов): Redis-adapter Socket.IO подключается
 * в bootstrap (setupWsRedisAdapter в apps/server) — авто в проде или при
 * WS_REDIS_ADAPTER=1; в dev/тестах — встроенный in-memory адаптер.
 */
@WebSocketGateway({
    namespace: '/chat',
    cors: { origin: ['*'], credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayInit {
    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly tokenVerifier: TokenVerifierContract,
        private readonly chatService: ChatService,
        private readonly config: AppConfigService,
    ) {}

    /**
     * Применяет CORS-origins из конфига (config.server.corsOrigins) к
     * underlying Socket.IO-серверу после инициализации шлюза.
     */
    afterInit(server: Server): void {
        const origins = this.config.server.corsOrigins;
        const engine = (server as { engine?: { opts?: { cors?: unknown } } }).engine;
        // CORS — лучшее усилие: применяем, только если движок Socket.IO уже доступен.
        if (origins.length > 0 && engine?.opts) {
            engine.opts.cors = { origin: origins, credentials: true };
        }
    }

    /** Достаёт payload пользователя, сохранённый при connection. */
    private getUser(client: Socket): JwtPayload | undefined {
        return client.data['user'] as JwtPayload | undefined;
    }

    /**
     * Аутентифицирует подключение: токен из handshake.auth.token либо
     * handshake.query.token. При ошибке/отсутствии — disconnect.
     */
    handleConnection(client: Socket): void {
        const fromAuth = (client.handshake.auth as Record<string, unknown> | undefined)?.['token'];
        const fromQuery = client.handshake.query['token'];
        const token =
            typeof fromAuth === 'string'
                ? fromAuth
                : typeof fromQuery === 'string'
                  ? fromQuery
                  : undefined;
        if (!token) {
            client.disconnect();
            return;
        }
        try {
            const payload = this.tokenVerifier.verifyAccess(token);
            client.data['user'] = payload;
        } catch {
            client.disconnect();
        }
    }

    /** Присоединяет клиента к комнате чата после проверки участия. */
    @SubscribeMessage('chat:join')
    async onJoin(client: Socket, body: ChatRef): Promise<Ack> {
        const user = this.getUser(client);
        if (!user) {
            return { error: 'errors.chat.unauthenticated' };
        }
        try {
            await this.chatService.getChatForParticipant(body.chatId, user);
            await client.join(body.chatId);
            return { ok: true };
        } catch (error) {
            return { error: this.errorMessage(error) };
        }
    }

    /** Отправляет сообщение, рассылает его и обновление unread в комнату. */
    @SubscribeMessage('message:send')
    async onSend(client: Socket, body: SendPayload): Promise<Ack<MessageView>> {
        const user = this.getUser(client);
        if (!user) {
            return { error: 'errors.chat.unauthenticated' };
        }
        try {
            const message = await this.chatService.sendMessage(body.chatId, user, {
                ...(body.type !== undefined ? { type: body.type } : {}),
                ...(body.text !== undefined ? { text: body.text } : {}),
                ...(body.attachmentUrl !== undefined ? { attachmentUrl: body.attachmentUrl } : {}),
            });
            this.server.to(body.chatId).emit('message:new', message);
            this.server
                .to(body.chatId)
                .emit('chat:unread', { chatId: body.chatId, senderId: user.sub });
            return { ok: true, data: message };
        } catch (error) {
            return { error: this.errorMessage(error) };
        }
    }

    /** Помечает чат прочитанным и уведомляет комнату. */
    @SubscribeMessage('message:read')
    async onRead(client: Socket, body: ChatRef): Promise<Ack> {
        const user = this.getUser(client);
        if (!user) {
            return { error: 'errors.chat.unauthenticated' };
        }
        try {
            await this.chatService.markRead(body.chatId, user);
            this.server
                .to(body.chatId)
                .emit('message:read', { chatId: body.chatId, userId: user.sub });
            return { ok: true };
        } catch (error) {
            return { error: this.errorMessage(error) };
        }
    }

    /** Извлекает messageKey из AppException, иначе общий ключ. */
    private errorMessage(error: unknown): string {
        if (error && typeof error === 'object' && 'messageKey' in error) {
            return String((error as { messageKey: unknown }).messageKey);
        }
        return 'errors.chat.failed';
    }
}
