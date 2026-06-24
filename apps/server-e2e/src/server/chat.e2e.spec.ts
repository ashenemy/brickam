import { resolve } from 'node:path';
import { ChatGateway, ChatService, ChatsRepository, MessagesRepository } from '@brickam/chat';
import { ConfigKitModule } from '@brickam/config-kit';
import { type JwtPayload, Role, TokenVerifierContract } from '@brickam/domain-kit';
import { type INestApplication, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { io, type Socket } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/** Фейковый верификатор: токен-строка → payload (без реального JWT). */
@Injectable()
class FakeTokenVerifier extends TokenVerifierContract {
    verifyAccess(token: string): JwtPayload {
        if (token === 'buyer') {
            return { sub: 'buyer1', role: Role.Buyer, permissions: [] };
        }
        if (token === 'vendor') {
            return { sub: 'vendorUser', role: Role.VendorOwner, permissions: [], vendorId: 'v1' };
        }
        if (token === 'out') {
            return { sub: 'outsider', role: Role.Buyer, permissions: [] };
        }
        throw new Error('invalid token');
    }
}

type ChatDoc = {
    id: string;
    _id: { toString: () => string };
    buyerId: string;
    vendorId: string;
    participants: Array<{ userId: string; role: string }>;
    unread: { buyer: number; vendor: number };
    lastMessageAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    save: () => Promise<void>;
};

const chat: ChatDoc = {
    id: 'c1',
    _id: { toString: () => 'c1' },
    buyerId: 'buyer1',
    vendorId: 'v1',
    participants: [
        { userId: 'buyer1', role: 'buyer' },
        { userId: 'v1', role: 'vendor' },
    ],
    unread: { buyer: 0, vendor: 0 },
    createdAt: new Date(),
    updatedAt: new Date(),
    save: async () => {},
};

@Injectable()
class FakeChatsRepo {
    async findById(id: string) {
        return id === 'c1' ? chat : null;
    }
    async findBetween() {
        return chat;
    }
    async create() {
        return chat;
    }
    async listForUser() {
        return [chat];
    }
    async listForVendor() {
        return [chat];
    }
}

@Injectable()
class FakeMessagesRepo {
    private seq = 0;
    async create(data: Record<string, unknown>) {
        this.seq += 1;
        const id = String(this.seq);
        return {
            ...data,
            id,
            _id: { toString: () => id },
            readBy: (data['readBy'] as string[]) ?? [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    async findByChat() {
        return {
            data: [],
            meta: {
                page: 1,
                pageSize: 20,
                total: 0,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            },
        };
    }
    async markReadByUser() {}
}

@Module({
    providers: [
        ChatGateway,
        ChatService,
        { provide: ChatsRepository, useClass: FakeChatsRepo },
        { provide: MessagesRepository, useClass: FakeMessagesRepo },
        { provide: TokenVerifierContract, useClass: FakeTokenVerifier },
    ],
})
class ChatTestModule {}

const testEnv = {
    MONGO_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'e2e-access',
    JWT_REFRESH_SECRET: 'e2e-refresh',
};

const connect = (port: number, token: string): Promise<Socket> =>
    new Promise((res, rej) => {
        const sock = io(`http://127.0.0.1:${port}/chat`, {
            auth: { token },
            transports: ['websocket'],
            reconnection: false,
        });
        sock.on('connect', () => res(sock));
        sock.on('connect_error', rej);
        setTimeout(() => rej(new Error('connect timeout')), 8000);
    });

const emitAck = (sock: Socket, event: string, payload: unknown): Promise<any> =>
    new Promise((res) => sock.emit(event, payload, (ack: unknown) => res(ack)));

const once = (sock: Socket, event: string): Promise<any> =>
    new Promise((res, rej) => {
        sock.once(event, res);
        setTimeout(() => rej(new Error(`no ${event}`)), 8000);
    });

describe('Chat e2e (real Socket.IO, две роли + запрет постороннего)', () => {
    let app: INestApplication;
    let port: number;
    const sockets: Socket[] = [];

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                ConfigKitModule.forRoot({
                    env: testEnv,
                    configDir: resolve(import.meta.dirname, '../../../../config'),
                }),
                ChatTestModule,
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        await app.listen(0);
        port = (app.getHttpServer().address() as { port: number }).port;
    });

    afterAll(async () => {
        for (const s of sockets) {
            s.disconnect();
        }
        await app?.close();
    });

    it('участники обмениваются сообщениями; посторонний не имеет доступа', async () => {
        const buyer = await connect(port, 'buyer');
        const vendor = await connect(port, 'vendor');
        const outsider = await connect(port, 'out');
        sockets.push(buyer, vendor, outsider);

        // join: участники — ok, посторонний — error
        expect((await emitAck(buyer, 'chat:join', { chatId: 'c1' })).ok).toBe(true);
        expect((await emitAck(vendor, 'chat:join', { chatId: 'c1' })).ok).toBe(true);
        const outsiderJoin = await emitAck(outsider, 'chat:join', { chatId: 'c1' });
        expect(outsiderJoin.ok).toBeUndefined();
        expect(outsiderJoin.error).toBeTruthy();

        // покупатель отправляет → вендор получает message:new
        const vendorRecv = once(vendor, 'message:new');
        const sendAck = await emitAck(buyer, 'message:send', { chatId: 'c1', text: 'привет' });
        expect(sendAck.ok).toBe(true);
        expect(sendAck.data.text).toBe('привет');
        const received = await vendorRecv;
        expect(received.text).toBe('привет');
        expect(received.senderId).toBe('buyer1');

        // посторонний не может отправить в чужой чат
        const outsiderSend = await emitAck(outsider, 'message:send', { chatId: 'c1', text: 'x' });
        expect(outsiderSend.ok).toBeUndefined();
        expect(outsiderSend.error).toBeTruthy();
    });
});
