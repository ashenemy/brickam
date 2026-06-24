import type { AppConfigService } from '@brickam/config-kit';
import { ForbiddenException } from '@brickam/core-kit';
import type { JwtPayload, TokenVerifierContract } from '@brickam/domain-kit';
import type { Socket } from 'socket.io';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatGateway } from './chat.gateway';
import type { ChatService } from './chat.service';

const payload: JwtPayload = { sub: 'b1', role: 'buyer', permissions: [] };

const makeClient = (over: Partial<Socket> = {}): Socket => {
    const client = {
        handshake: { auth: {}, query: {} },
        data: {},
        join: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn(),
        ...over,
    };
    return client as unknown as Socket;
};

describe('ChatGateway', () => {
    let tokenVerifier: { verifyAccess: ReturnType<typeof vi.fn> };
    let chatService: {
        getChatForParticipant: ReturnType<typeof vi.fn>;
        sendMessage: ReturnType<typeof vi.fn>;
        markRead: ReturnType<typeof vi.fn>;
    };
    let config: { server: { corsOrigins: string[] } };
    let gateway: ChatGateway;
    let emit: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        tokenVerifier = { verifyAccess: vi.fn() };
        chatService = {
            getChatForParticipant: vi.fn(),
            sendMessage: vi.fn(),
            markRead: vi.fn().mockResolvedValue(undefined),
        };
        config = { server: { corsOrigins: [] } };
        gateway = new ChatGateway(
            tokenVerifier as unknown as TokenVerifierContract,
            chatService as unknown as ChatService,
            config as unknown as AppConfigService,
        );
        emit = vi.fn();
        gateway.server = { to: vi.fn().mockReturnValue({ emit }) } as never;
    });

    describe('handleConnection', () => {
        it('валидный токен из auth → user в client.data', () => {
            tokenVerifier.verifyAccess.mockReturnValue(payload);
            const client = makeClient({
                handshake: { auth: { token: 'tok' }, query: {} } as never,
            });
            gateway.handleConnection(client);
            expect(tokenVerifier.verifyAccess).toHaveBeenCalledWith('tok');
            expect((client.data as Record<string, unknown>)['user']).toEqual(payload);
            expect(client.disconnect).not.toHaveBeenCalled();
        });

        it('токен из query тоже принимается', () => {
            tokenVerifier.verifyAccess.mockReturnValue(payload);
            const client = makeClient({
                handshake: { auth: {}, query: { token: 'qtok' } } as never,
            });
            gateway.handleConnection(client);
            expect(tokenVerifier.verifyAccess).toHaveBeenCalledWith('qtok');
            expect((client.data as Record<string, unknown>)['user']).toEqual(payload);
        });

        it('нет токена → disconnect', () => {
            const client = makeClient();
            gateway.handleConnection(client);
            expect(client.disconnect).toHaveBeenCalled();
        });

        it('невалидный токен → disconnect', () => {
            tokenVerifier.verifyAccess.mockImplementation(() => {
                throw new Error('bad');
            });
            const client = makeClient({
                handshake: { auth: { token: 'bad' }, query: {} } as never,
            });
            gateway.handleConnection(client);
            expect(client.disconnect).toHaveBeenCalled();
        });
    });

    describe('onJoin', () => {
        it('участник → join + ok', async () => {
            chatService.getChatForParticipant.mockResolvedValue({});
            const client = makeClient({ data: { user: payload } as never });
            const ack = await gateway.onJoin(client, { chatId: 'c1' });
            expect(client.join).toHaveBeenCalledWith('c1');
            expect(ack).toEqual({ ok: true });
        });

        it('нет доступа → { error }, сокет жив', async () => {
            chatService.getChatForParticipant.mockRejectedValue(
                new ForbiddenException('errors.chat.notParticipant'),
            );
            const client = makeClient({ data: { user: payload } as never });
            const ack = await gateway.onJoin(client, { chatId: 'c1' });
            expect(ack).toEqual({ error: 'errors.chat.notParticipant' });
            expect(client.disconnect).not.toHaveBeenCalled();
        });
    });

    describe('onSend', () => {
        it('зовёт сервис и эмитит message:new + chat:unread в комнату', async () => {
            const message = { id: 'm1', chatId: 'c1', senderId: 'b1' };
            chatService.sendMessage.mockResolvedValue(message);
            const client = makeClient({ data: { user: payload } as never });

            const ack = await gateway.onSend(client, { chatId: 'c1', text: 'hi' });

            expect(chatService.sendMessage).toHaveBeenCalledWith('c1', payload, { text: 'hi' });
            expect(gateway.server.to).toHaveBeenCalledWith('c1');
            expect(emit).toHaveBeenCalledWith('message:new', message);
            expect(emit).toHaveBeenCalledWith('chat:unread', { chatId: 'c1', senderId: 'b1' });
            expect(ack).toEqual({ ok: true, data: message });
        });

        it('ошибка доступа → { error }', async () => {
            chatService.sendMessage.mockRejectedValue(
                new ForbiddenException('errors.chat.notParticipant'),
            );
            const client = makeClient({ data: { user: payload } as never });
            const ack = await gateway.onSend(client, { chatId: 'c1', text: 'x' });
            expect(ack).toEqual({ error: 'errors.chat.notParticipant' });
        });
    });

    describe('onRead', () => {
        it('markRead + эмит message:read', async () => {
            const client = makeClient({ data: { user: payload } as never });
            const ack = await gateway.onRead(client, { chatId: 'c1' });
            expect(chatService.markRead).toHaveBeenCalledWith('c1', payload);
            expect(emit).toHaveBeenCalledWith('message:read', { chatId: 'c1', userId: 'b1' });
            expect(ack).toEqual({ ok: true });
        });
    });

    describe('неаутентифицированный клиент (нет user)', () => {
        it('onJoin → error', async () => {
            const ack = await gateway.onJoin(makeClient(), { chatId: 'c1' });
            expect(ack).toEqual({ error: 'errors.chat.unauthenticated' });
        });

        it('onSend → error', async () => {
            const ack = await gateway.onSend(makeClient(), { chatId: 'c1', text: 'x' });
            expect(ack).toEqual({ error: 'errors.chat.unauthenticated' });
        });

        it('onRead → error', async () => {
            const ack = await gateway.onRead(makeClient(), { chatId: 'c1' });
            expect(ack).toEqual({ error: 'errors.chat.unauthenticated' });
        });
    });

    describe('onSend (полная нагрузка / не-AppException ошибка)', () => {
        it('передаёт type/attachmentUrl и эмитит', async () => {
            chatService.sendMessage.mockResolvedValue({ id: 'm2' });
            const client = makeClient({ data: { user: payload } as never });
            await gateway.onSend(client, {
                chatId: 'c1',
                type: 'file',
                text: 't',
                attachmentUrl: 'http://f/z',
            });
            expect(chatService.sendMessage).toHaveBeenCalledWith('c1', payload, {
                type: 'file',
                text: 't',
                attachmentUrl: 'http://f/z',
            });
        });

        it('обычная ошибка (без messageKey) → общий ключ errors.chat.failed', async () => {
            chatService.sendMessage.mockRejectedValue(new Error('boom'));
            const client = makeClient({ data: { user: payload } as never });
            const ack = await gateway.onSend(client, { chatId: 'c1', text: 'x' });
            expect(ack).toEqual({ error: 'errors.chat.failed' });
        });
    });

    describe('afterInit', () => {
        it('применяет corsOrigins из конфига к серверу', () => {
            config.server.corsOrigins = ['http://localhost:4200'];
            const engine = { opts: {} as Record<string, unknown> };
            gateway.afterInit({ engine } as never);
            expect(engine.opts['cors']).toEqual({
                origin: ['http://localhost:4200'],
                credentials: true,
            });
        });

        it('пустой список origins — не трогает сервер', () => {
            config.server.corsOrigins = [];
            const engine = { opts: {} as Record<string, unknown> };
            gateway.afterInit({ engine } as never);
            expect(engine.opts['cors']).toBeUndefined();
        });
    });
});
