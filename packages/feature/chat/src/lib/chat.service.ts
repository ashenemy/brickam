import type { Page } from '@brickam/core-kit';
import { ForbiddenException, NotFoundException } from '@brickam/core-kit';
import type { JwtPayload } from '@brickam/domain-kit';
import { Role } from '@brickam/domain-kit';
import type { PaginationQueryDto } from '@brickam/server-kit';
import { Injectable } from '@nestjs/common';
import type { ChatView, MessageView, SendMessagePayload } from '../@types';
import type { ChatDocument } from './chat.schema';
import { ChatsRepository } from './chats.repository';
import type { MessageDocument } from './message.schema';
import { MessagesRepository } from './messages.repository';

/**
 * Сервис чата (Foundations §15, Stage 8). Чат связывает покупателя (`buyerId`)
 * и вендора (`vendorId`). Доступ к чату/сообщениям — только участнику:
 * покупатель если `sub === buyerId`, вендор если `vendorId === chat.vendorId`.
 * Границы feature: зависит только от kit/domain.
 */
@Injectable()
export class ChatService {
    constructor(
        private readonly chatsRepository: ChatsRepository,
        private readonly messagesRepository: MessagesRepository,
    ) {}

    /** true, если запрос исходит со стороны покупателя данного чата. */
    isBuyerSide(chat: ChatDocument, payload: JwtPayload): boolean {
        return payload.sub === chat.buyerId;
    }

    /** true, если запрос исходит со стороны вендора данного чата. */
    private isVendorSide(chat: ChatDocument, payload: JwtPayload): boolean {
        return payload.vendorId !== undefined && payload.vendorId === chat.vendorId;
    }

    /**
     * Бросает ForbiddenException, если пользователь не участник чата.
     * Участник — покупатель (sub===buyerId) или вендор (vendorId===chat.vendorId).
     */
    assertParticipant(chat: ChatDocument, payload: JwtPayload): boolean {
        if (this.isBuyerSide(chat, payload) || this.isVendorSide(chat, payload)) {
            return true;
        }
        throw new ForbiddenException('errors.chat.notParticipant');
    }

    /** Маппит документ чата в плоский контракт (unread для стороны пользователя). */
    private toChatView(chat: ChatDocument, payload: JwtPayload): ChatView {
        const unread = this.isBuyerSide(chat, payload) ? chat.unread.buyer : chat.unread.vendor;
        const view: ChatView = {
            id: chat.id ?? chat._id.toString(),
            buyerId: chat.buyerId,
            vendorId: chat.vendorId,
            participants: chat.participants.map((participant) => ({
                userId: participant.userId,
                role: participant.role,
            })),
            unread,
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
        };
        if (chat.lastMessageAt !== undefined && chat.lastMessageAt !== null) {
            view.lastMessageAt = chat.lastMessageAt;
        }
        return view;
    }

    /** Маппит документ сообщения в плоский контракт. */
    private toMessageView(message: MessageDocument): MessageView {
        const view: MessageView = {
            id: message.id ?? message._id.toString(),
            chatId: message.chatId,
            senderId: message.senderId,
            type: message.type,
            readBy: [...message.readBy],
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
        };
        if (message.text !== undefined) {
            view.text = message.text;
        }
        if (message.attachmentUrl !== undefined) {
            view.attachmentUrl = message.attachmentUrl;
        }
        if (message.invoiceId !== undefined) {
            view.invoiceId = message.invoiceId;
        }
        return view;
    }

    /** Загружает чат по id или бросает NotFoundException. */
    private async loadChat(chatId: string): Promise<ChatDocument> {
        const chat = await this.chatsRepository.findById(chatId);
        if (!chat) {
            throw new NotFoundException('errors.chat.notFound');
        }
        return chat;
    }

    /**
     * Находит существующий чат покупателя с вендором или создаёт новый с
     * participants=[{buyer},{vendor}] и unread {buyer:0, vendor:0}.
     */
    async getOrCreate(buyerId: string, vendorId: string): Promise<ChatView> {
        const existing = await this.chatsRepository.findBetween(buyerId, vendorId);
        const payload: JwtPayload = { sub: buyerId, role: Role.Buyer, permissions: [] };
        if (existing) {
            return this.toChatView(existing, payload);
        }
        const created = await this.chatsRepository.create({
            buyerId,
            vendorId,
            participants: [
                { userId: buyerId, role: 'buyer' },
                { userId: vendorId, role: 'vendor' },
            ],
            unread: { buyer: 0, vendor: 0 },
        });
        return this.toChatView(created, payload);
    }

    /** Загружает чат и проверяет участие — для использования из gateway. */
    async getChatForParticipant(chatId: string, payload: JwtPayload): Promise<ChatDocument> {
        const chat = await this.loadChat(chatId);
        this.assertParticipant(chat, payload);
        return chat;
    }

    /** Чаты, где пользователь участник (покупатель по sub, вендор по vendorId). */
    async listChats(payload: JwtPayload): Promise<ChatView[]> {
        const byBuyer = await this.chatsRepository.listForUser(payload.sub);
        const byVendor =
            payload.vendorId !== undefined
                ? await this.chatsRepository.listForVendor(payload.vendorId)
                : [];
        const seen = new Set<string>();
        const result: ChatView[] = [];
        for (const chat of [...byBuyer, ...byVendor]) {
            const id = chat.id ?? chat._id.toString();
            if (seen.has(id)) {
                continue;
            }
            seen.add(id);
            result.push(this.toChatView(chat, payload));
        }
        return result;
    }

    /** Сообщения чата (пагинация) после проверки участия. */
    async getMessages(
        chatId: string,
        payload: JwtPayload,
        query: PaginationQueryDto,
    ): Promise<Page<MessageView>> {
        const chat = await this.loadChat(chatId);
        this.assertParticipant(chat, payload);
        const page = await this.messagesRepository.findByChat(chatId, {
            page: query.page,
            pageSize: query.pageSize,
        });
        return {
            data: page.data.map((message) => this.toMessageView(message)),
            meta: page.meta,
        };
    }

    /**
     * Отправляет сообщение в чат (senderId = sub). Увеличивает unread
     * противоположной стороны, обновляет lastMessageAt.
     */
    async sendMessage(
        chatId: string,
        payload: JwtPayload,
        dto: SendMessagePayload,
    ): Promise<MessageView> {
        const chat = await this.loadChat(chatId);
        this.assertParticipant(chat, payload);

        const created = await this.messagesRepository.create({
            chatId,
            senderId: payload.sub,
            type: dto.type ?? 'text',
            ...(dto.text !== undefined ? { text: dto.text } : {}),
            ...(dto.attachmentUrl !== undefined ? { attachmentUrl: dto.attachmentUrl } : {}),
            readBy: [payload.sub],
        });

        if (this.isBuyerSide(chat, payload)) {
            chat.unread.vendor += 1;
        } else {
            chat.unread.buyer += 1;
        }
        chat.lastMessageAt = created.createdAt ?? new Date();
        await chat.save();

        return this.toMessageView(created);
    }

    /**
     * Помечает непрочитанные сообщения чата прочитанными для пользователя
     * (добавляет sub в readBy) и сбрасывает unread его стороны в 0.
     */
    async markRead(chatId: string, payload: JwtPayload): Promise<void> {
        const chat = await this.loadChat(chatId);
        this.assertParticipant(chat, payload);

        await this.messagesRepository.markReadByUser(chatId, payload.sub);

        if (this.isBuyerSide(chat, payload)) {
            chat.unread.buyer = 0;
        } else {
            chat.unread.vendor = 0;
        }
        await chat.save();
    }
}
