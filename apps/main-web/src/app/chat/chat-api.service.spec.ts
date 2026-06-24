import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { ChatApiService } from './chat-api.service';
import type { ChatView, MessageView } from './models';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function chat(id: string): ChatView {
    return {
        id,
        buyerId: 'b1',
        vendorId: 'v1',
        participants: ['b1', 'v1'],
        unread: { buyer: 0, vendor: 0 },
    };
}

function msg(id: string): MessageView {
    return {
        id,
        chatId: 'c1',
        senderId: 'b1',
        type: 'text',
        text: 'hi',
        readBy: [],
        createdAt: '2026-01-01T00:00:00Z',
    };
}

describe('ChatApiService', () => {
    let service: ChatApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(ChatApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('list шлёт GET /chat', () => {
        let len = -1;
        service.list().subscribe((d) => (len = d.length));
        const req = httpMock.expectOne('http://api.test/api/chat');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: [chat('c1'), chat('c2')] });
        expect(len).toBe(2);
    });

    it('getOrCreate шлёт POST /chat с vendorId', () => {
        let id = '';
        service.getOrCreate('v1').subscribe((c) => (id = c.id));
        const req = httpMock.expectOne('http://api.test/api/chat');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ vendorId: 'v1' });
        req.flush({ success: true, data: chat('c9') });
        expect(id).toBe('c9');
    });

    it('messages шлёт GET /chat/:id/messages с page/pageSize', () => {
        let len = -1;
        service.messages('c1', 2).subscribe((d) => (len = d.length));
        const req = httpMock.expectOne((r) => r.url === 'http://api.test/api/chat/c1/messages');
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('page')).toBe('2');
        expect(req.request.params.get('pageSize')).toBe('30');
        req.flush({ success: true, data: [msg('m1')] });
        expect(len).toBe(1);
    });

    it('markRead шлёт POST /chat/:id/read', () => {
        service.markRead('c1').subscribe();
        const req = httpMock.expectOne('http://api.test/api/chat/c1/read');
        expect(req.request.method).toBe('POST');
        req.flush({ success: true, data: {} });
    });
});
