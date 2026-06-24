import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { Subject } from 'rxjs';
import { ChatStore } from './chat.store';
import { ChatSocketService, type ReadEvent, type UnreadEvent } from './chat-socket.service';
import type { ChatView, MessageView } from './models';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function chat(id: string, buyerUnread: number): ChatView {
    return {
        id,
        buyerId: 'b1',
        vendorId: `v-${id}`,
        participants: ['b1', `v-${id}`],
        unread: { buyer: buyerUnread, vendor: 0 },
    };
}

function message(id: string, chatId: string, senderId: string): MessageView {
    return {
        id,
        chatId,
        senderId,
        type: 'text',
        text: 'hello',
        readBy: [],
        createdAt: '2026-01-01T00:00:00Z',
    };
}

class SocketMock {
    readonly messageNew$ = new Subject<MessageView>();
    readonly messageRead$ = new Subject<ReadEvent>();
    readonly unread$ = new Subject<UnreadEvent>();
    connect = vi.fn();
    join = vi.fn();
    disconnect = vi.fn();
    send = vi.fn((chatId: string, _text: string) =>
        Promise.resolve(message('m-sent', chatId, 'b1')),
    );
}

describe('ChatStore', () => {
    let store: ChatStore;
    let httpMock: HttpTestingController;
    let socket: SocketMock;

    beforeEach(() => {
        socket = new SocketMock();
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
                { provide: ChatSocketService, useValue: socket },
            ],
        });
        store = TestBed.inject(ChatStore);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('loadChats заполняет список и считает totalUnread', () => {
        store.loadChats();
        httpMock.expectOne('http://api.test/api/chat').flush({
            success: true,
            data: [chat('c1', 2), chat('c2', 3)],
        });
        expect(store.chats().length).toBe(2);
        expect(store.totalUnread()).toBe(5);
    });

    it('open грузит сообщения, join-ит сокет и шлёт markRead', () => {
        store.open('c1');
        expect(socket.join).toHaveBeenCalledWith('c1');

        httpMock
            .expectOne((r) => r.url === 'http://api.test/api/chat/c1/messages')
            .flush({ success: true, data: [message('m1', 'c1', 'v-c1')] });

        httpMock.expectOne('http://api.test/api/chat/c1/read').flush({ success: true, data: {} });

        expect(store.messages().length).toBe(1);
        expect(store.activeChatId()).toBe('c1');
    });

    it('send добавляет отправленное сообщение в активный чат', async () => {
        store.activeChatId.set('c1');
        await store.send('  hi  ');
        expect(socket.send).toHaveBeenCalledWith('c1', 'hi');
        expect(store.messages().length).toBe(1);
        expect(store.messages()[0].id).toBe('m-sent');
    });

    it('message:new входящее в неактивный чат увеличивает unread покупателя', () => {
        store.loadChats();
        httpMock
            .expectOne('http://api.test/api/chat')
            .flush({ success: true, data: [chat('c1', 0)] });

        socket.messageNew$.next(message('m9', 'c1', 'v-c1'));
        expect(store.totalUnread()).toBe(1);
    });
});
