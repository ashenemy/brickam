import { ForbiddenException, NotFoundException } from '@brickam/core-kit';
import type { JwtPayload } from '@brickam/domain-kit';
import type { PaginationQueryDto } from '@brickam/server-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatService } from './chat.service';
import type { ChatsRepository } from './chats.repository';
import type { MessagesRepository } from './messages.repository';

type ChatOver = Record<string, unknown>;

const makeChatDoc = (over: ChatOver = {}) => {
    const doc = {
        id: 'c1',
        _id: { toString: () => 'c1' },
        buyerId: 'b1',
        vendorId: 'v1',
        participants: [
            { userId: 'b1', role: 'buyer' },
            { userId: 'v1', role: 'vendor' },
        ],
        lastMessageAt: undefined as Date | undefined,
        unread: { buyer: 0, vendor: 0 },
        createdAt: new Date('2026-06-01'),
        updatedAt: new Date('2026-06-01'),
        save: vi.fn().mockResolvedValue(undefined),
        ...over,
    };
    return doc;
};

const makeMessageDoc = (over: Record<string, unknown> = {}) => ({
    id: 'm1',
    _id: { toString: () => 'm1' },
    chatId: 'c1',
    senderId: 'b1',
    type: 'text',
    text: 'hi',
    attachmentUrl: undefined,
    invoiceId: undefined,
    readBy: ['b1'],
    createdAt: new Date('2026-06-02'),
    updatedAt: new Date('2026-06-02'),
    ...over,
});

const buyerPayload: JwtPayload = { sub: 'b1', role: 'buyer', permissions: [] };
const vendorPayload: JwtPayload = {
    sub: 'u-vendor',
    role: 'vendor',
    permissions: [],
    vendorId: 'v1',
};
const strangerPayload: JwtPayload = { sub: 'x', role: 'buyer', permissions: [], vendorId: 'v9' };

const query: PaginationQueryDto = { page: 1, pageSize: 20 };

describe('ChatService', () => {
    let chats: {
        findBetween: ReturnType<typeof vi.fn>;
        findById: ReturnType<typeof vi.fn>;
        listForUser: ReturnType<typeof vi.fn>;
        listForVendor: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
    };
    let messages: {
        create: ReturnType<typeof vi.fn>;
        findByChat: ReturnType<typeof vi.fn>;
        markReadByUser: ReturnType<typeof vi.fn>;
    };
    let service: ChatService;

    beforeEach(() => {
        chats = {
            findBetween: vi.fn(),
            findById: vi.fn(),
            listForUser: vi.fn().mockResolvedValue([]),
            listForVendor: vi.fn().mockResolvedValue([]),
            create: vi.fn(),
        };
        messages = {
            create: vi.fn(),
            findByChat: vi.fn(),
            markReadByUser: vi.fn().mockResolvedValue(0),
        };
        service = new ChatService(
            chats as unknown as ChatsRepository,
            messages as unknown as MessagesRepository,
        );
    });

    describe('getOrCreate', () => {
        it('создаёт чат при отсутствии с participants и unread {0,0}', async () => {
            chats.findBetween.mockResolvedValue(null);
            chats.create.mockResolvedValue(makeChatDoc());

            const view = await service.getOrCreate('b1', 'v1');

            expect(chats.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    buyerId: 'b1',
                    vendorId: 'v1',
                    participants: [
                        { userId: 'b1', role: 'buyer' },
                        { userId: 'v1', role: 'vendor' },
                    ],
                    unread: { buyer: 0, vendor: 0 },
                }),
            );
            expect(view.id).toBe('c1');
            expect(view.unread).toBe(0);
        });

        it('переиспользует существующий чат', async () => {
            chats.findBetween.mockResolvedValue(makeChatDoc());
            const view = await service.getOrCreate('b1', 'v1');
            expect(chats.create).not.toHaveBeenCalled();
            expect(view.id).toBe('c1');
        });
    });

    describe('assertParticipant', () => {
        it('покупатель (sub===buyerId) — участник', () => {
            expect(service.assertParticipant(makeChatDoc() as never, buyerPayload)).toBe(true);
        });

        it('вендор (vendorId===chat.vendorId) — участник', () => {
            expect(service.assertParticipant(makeChatDoc() as never, vendorPayload)).toBe(true);
        });

        it('посторонний — ForbiddenException', () => {
            expect(() =>
                service.assertParticipant(makeChatDoc() as never, strangerPayload),
            ).toThrow(ForbiddenException);
        });
    });

    describe('getMessages', () => {
        it('посторонний → ForbiddenException', async () => {
            chats.findById.mockResolvedValue(makeChatDoc());
            await expect(service.getMessages('c1', strangerPayload, query)).rejects.toBeInstanceOf(
                ForbiddenException,
            );
        });

        it('чат не найден → NotFoundException', async () => {
            chats.findById.mockResolvedValue(null);
            await expect(service.getMessages('cX', buyerPayload, query)).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });

        it('участник получает страницу сообщений', async () => {
            chats.findById.mockResolvedValue(makeChatDoc());
            messages.findByChat.mockResolvedValue({
                data: [makeMessageDoc()],
                meta: {
                    page: 1,
                    pageSize: 20,
                    total: 1,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false,
                },
            });
            const page = await service.getMessages('c1', buyerPayload, query);
            expect(page.data).toHaveLength(1);
            expect(page.data[0]?.id).toBe('m1');
        });
    });

    describe('sendMessage', () => {
        it('buyer отправил → unread.vendor вырос, lastMessageAt обновлён, senderId=sub', async () => {
            const chat = makeChatDoc();
            chats.findById.mockResolvedValue(chat);
            const created = makeMessageDoc({ senderId: 'b1', createdAt: new Date('2026-06-03') });
            messages.create.mockResolvedValue(created);

            const view = await service.sendMessage('c1', buyerPayload, { text: 'hi' });

            expect(messages.create).toHaveBeenCalledWith(
                expect.objectContaining({ chatId: 'c1', senderId: 'b1', readBy: ['b1'] }),
            );
            expect(chat.unread.vendor).toBe(1);
            expect(chat.unread.buyer).toBe(0);
            expect(chat.lastMessageAt).toEqual(new Date('2026-06-03'));
            expect(chat.save).toHaveBeenCalled();
            expect(view.senderId).toBe('b1');
        });

        it('vendor отправил → unread.buyer вырос', async () => {
            const chat = makeChatDoc();
            chats.findById.mockResolvedValue(chat);
            messages.create.mockResolvedValue(makeMessageDoc({ senderId: 'u-vendor' }));

            await service.sendMessage('c1', vendorPayload, { text: 'yo' });

            expect(chat.unread.buyer).toBe(1);
            expect(chat.unread.vendor).toBe(0);
        });

        it('посторонний → ForbiddenException', async () => {
            chats.findById.mockResolvedValue(makeChatDoc());
            await expect(
                service.sendMessage('c1', strangerPayload, { text: 'x' }),
            ).rejects.toBeInstanceOf(ForbiddenException);
        });
    });

    describe('markRead', () => {
        it('buyer: сбрасывает unread.buyer в 0 и добавляет в readBy', async () => {
            const chat = makeChatDoc({ unread: { buyer: 5, vendor: 2 } });
            chats.findById.mockResolvedValue(chat);

            await service.markRead('c1', buyerPayload);

            expect(messages.markReadByUser).toHaveBeenCalledWith('c1', 'b1');
            expect(chat.unread.buyer).toBe(0);
            expect(chat.unread.vendor).toBe(2);
            expect(chat.save).toHaveBeenCalled();
        });

        it('vendor: сбрасывает unread.vendor в 0', async () => {
            const chat = makeChatDoc({ unread: { buyer: 3, vendor: 7 } });
            chats.findById.mockResolvedValue(chat);

            await service.markRead('c1', vendorPayload);

            expect(messages.markReadByUser).toHaveBeenCalledWith('c1', 'u-vendor');
            expect(chat.unread.vendor).toBe(0);
            expect(chat.unread.buyer).toBe(3);
        });
    });

    describe('listChats', () => {
        it('возвращает чаты участника c unread его стороны, без дублей', async () => {
            const chat = makeChatDoc({ unread: { buyer: 4, vendor: 1 } });
            chats.listForUser.mockResolvedValue([chat]);
            chats.listForVendor.mockResolvedValue([chat]);

            const list = await service.listChats({
                sub: 'b1',
                role: 'buyer',
                permissions: [],
                vendorId: 'v1',
            });

            expect(list).toHaveLength(1);
            // sub===buyerId → сторона покупателя → unread.buyer
            expect(list[0]?.unread).toBe(4);
        });
    });

    describe('views (optional поля)', () => {
        it('toChatView отдаёт lastMessageAt, toMessageView — attachmentUrl/invoiceId', async () => {
            const chat = makeChatDoc({
                lastMessageAt: new Date('2026-06-05'),
                unread: { buyer: 2, vendor: 0 },
            });
            chats.findById.mockResolvedValue(chat);
            chats.listForUser.mockResolvedValue([chat]);
            messages.findByChat.mockResolvedValue({
                data: [
                    makeMessageDoc({
                        type: 'file',
                        text: undefined,
                        attachmentUrl: 'http://f/x',
                        invoiceId: 'inv1',
                    }),
                ],
                meta: {
                    page: 1,
                    pageSize: 20,
                    total: 1,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false,
                },
            });

            const list = await service.listChats({ sub: 'b1', role: 'buyer', permissions: [] });
            expect(list[0]?.lastMessageAt).toEqual(new Date('2026-06-05'));

            const page = await service.getMessages('c1', buyerPayload, query);
            expect(page.data[0]?.attachmentUrl).toBe('http://f/x');
            expect(page.data[0]?.invoiceId).toBe('inv1');
            expect(page.data[0]?.text).toBeUndefined();
        });

        it('sendMessage с attachmentUrl и type пишет их в сообщение', async () => {
            const chat = makeChatDoc();
            chats.findById.mockResolvedValue(chat);
            messages.create.mockResolvedValue(
                makeMessageDoc({ type: 'file', attachmentUrl: 'http://f/y' }),
            );
            await service.sendMessage('c1', buyerPayload, {
                type: 'file',
                attachmentUrl: 'http://f/y',
            });
            expect(messages.create).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'file', attachmentUrl: 'http://f/y' }),
            );
        });

        it('sendMessage без createdAt у созданного сообщения ставит текущую дату', async () => {
            const chat = makeChatDoc();
            chats.findById.mockResolvedValue(chat);
            messages.create.mockResolvedValue(makeMessageDoc({ createdAt: undefined }));
            await service.sendMessage('c1', buyerPayload, { text: 'x' });
            expect(chat.lastMessageAt).toBeInstanceOf(Date);
        });
    });

    describe('getChatForParticipant', () => {
        it('возвращает чат участнику', async () => {
            const chat = makeChatDoc();
            chats.findById.mockResolvedValue(chat);
            await expect(service.getChatForParticipant('c1', buyerPayload)).resolves.toBe(chat);
        });

        it('посторонний → ForbiddenException', async () => {
            chats.findById.mockResolvedValue(makeChatDoc());
            await expect(
                service.getChatForParticipant('c1', strangerPayload),
            ).rejects.toBeInstanceOf(ForbiddenException);
        });
    });
});
