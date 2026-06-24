import { isPlatformBrowser } from '@angular/common';
import { computed, Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { ChatApiService } from './chat-api.service';
import { ChatSocketService } from './chat-socket.service';
import type { ChatView, MessageView } from './models';

/**
 * Глобальное состояние чата покупателя. Сигналы для списка диалогов,
 * активного чата и его сообщений. Производный счётчик непрочитанных
 * покупателя. Подписывается на socket-события. SSR-безопасно.
 */
@Injectable({ providedIn: 'root' })
export class ChatStore {
    private readonly api = inject(ChatApiService);
    private readonly socket = inject(ChatSocketService);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    readonly chats = signal<ChatView[]>([]);
    readonly activeChatId = signal<string | null>(null);
    readonly messages = signal<MessageView[]>([]);

    /** Суммарно непрочитанных у покупателя по всем чатам. */
    readonly totalUnread = computed(() =>
        this.chats().reduce((sum, c) => sum + (c.unread?.buyer ?? 0), 0),
    );

    private subscribed = false;

    constructor() {
        if (this.isBrowser) {
            this.socket.connect();
            this.subscribe();
        }
    }

    /** ID текущего пользователя (buyerId активного/любого чата). */
    get selfId(): string | null {
        return this.chats()[0]?.buyerId ?? null;
    }

    /** Загрузить список диалогов. Безопасно при SSR/без токена. */
    loadChats(): void {
        this.api
            .list()
            .pipe(catchError(() => of(null)))
            .subscribe((data) => {
                if (data) {
                    this.chats.set(data);
                }
            });
    }

    /** Открыть чат: грузим сообщения, входим в комнату, отмечаем прочитанным. */
    open(chatId: string): void {
        this.activeChatId.set(chatId);
        this.messages.set([]);
        this.socket.join(chatId);
        this.api
            .messages(chatId)
            .pipe(catchError(() => of([] as MessageView[])))
            .subscribe((msgs) => {
                if (this.activeChatId() === chatId) {
                    this.messages.set([...msgs].sort(byCreatedAt));
                }
            });
        this.markRead(chatId);
    }

    /** Отправить сообщение в активный чат через сокет (ack → message). */
    async send(text: string): Promise<void> {
        const chatId = this.activeChatId();
        const trimmed = text.trim();
        if (!chatId || !trimmed) {
            return;
        }
        try {
            const msg = await this.socket.send(chatId, trimmed);
            this.appendMessage(msg);
        } catch {
            // отправка не удалась — глушим (UI остаётся прежним)
        }
    }

    private markRead(chatId: string): void {
        this.api
            .markRead(chatId)
            .pipe(catchError(() => of(null)))
            .subscribe(() => this.resetUnread(chatId));
    }

    private resetUnread(chatId: string): void {
        this.chats.update((list) =>
            list.map((c) => (c.id === chatId ? { ...c, unread: { ...c.unread, buyer: 0 } } : c)),
        );
    }

    private appendMessage(msg: MessageView): void {
        if (this.messages().some((m) => m.id === msg.id)) {
            return;
        }
        this.messages.update((list) => [...list, msg]);
    }

    private subscribe(): void {
        if (this.subscribed) {
            return;
        }
        this.subscribed = true;

        this.socket.messageNew$.subscribe((msg) => {
            if (msg.chatId === this.activeChatId()) {
                this.appendMessage(msg);
                this.markRead(msg.chatId);
            } else {
                this.bumpUnread(msg.chatId);
            }
            this.touchLastMessage(msg);
        });

        this.socket.messageRead$.subscribe(({ chatId, userId }) => {
            this.messages.update((list) =>
                list.map((m) =>
                    m.chatId === chatId && !m.readBy.includes(userId)
                        ? { ...m, readBy: [...m.readBy, userId] }
                        : m,
                ),
            );
        });

        this.socket.unread$.subscribe(({ chatId, unread }) => {
            if (typeof unread === 'number') {
                this.chats.update((list) =>
                    list.map((c) =>
                        c.id === chatId ? { ...c, unread: { ...c.unread, buyer: unread } } : c,
                    ),
                );
            }
        });
    }

    private bumpUnread(chatId: string): void {
        this.chats.update((list) =>
            list.map((c) =>
                c.id === chatId
                    ? { ...c, unread: { ...c.unread, buyer: (c.unread?.buyer ?? 0) + 1 } }
                    : c,
            ),
        );
    }

    private touchLastMessage(msg: MessageView): void {
        this.chats.update((list) =>
            list.map((c) => (c.id === msg.chatId ? { ...c, lastMessageAt: msg.createdAt } : c)),
        );
    }
}

function byCreatedAt(a: MessageView, b: MessageView): number {
    return a.createdAt.localeCompare(b.createdAt);
}
