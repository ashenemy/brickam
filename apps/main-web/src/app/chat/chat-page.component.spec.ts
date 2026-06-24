import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { Subject } from 'rxjs';
import { ChatStore } from './chat.store';
import { ChatPageComponent } from './chat-page.component';
import { ChatSocketService } from './chat-socket.service';
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
        vendorId: `v-${id}`,
        participants: ['b1', `v-${id}`],
        unread: { buyer: 0, vendor: 0 },
    };
}

class SocketMock {
    readonly messageNew$ = new Subject<MessageView>();
    readonly messageRead$ = new Subject<unknown>();
    readonly unread$ = new Subject<unknown>();
    connect = vi.fn();
    join = vi.fn();
    disconnect = vi.fn();
    send = vi.fn().mockResolvedValue(undefined);
}

describe('ChatPageComponent', () => {
    let fixture: ComponentFixture<ChatPageComponent>;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ChatPageComponent],
            providers: [
                provideRouter([]),
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
                { provide: ChatSocketService, useValue: new SocketMock() },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatPageComponent);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        for (const r of httpMock.match(() => true)) {
            if (!r.cancelled) {
                r.flush({ success: true, data: [] });
            }
        }
        httpMock.verify();
    });

    it('рендерит список диалогов из мока', () => {
        fixture.detectChanges();
        httpMock
            .expectOne('http://api.test/api/chat')
            .flush({ success: true, data: [chat('c1'), chat('c2')] });
        fixture.detectChanges();

        const items = (fixture.nativeElement as HTMLElement).querySelectorAll(
            '[data-testid="chat-item"]',
        );
        expect(items.length).toBe(2);
    });

    it('выбор чата грузит сообщения через store.open', () => {
        const store = TestBed.inject(ChatStore);
        const openSpy = vi.spyOn(store, 'open');

        fixture.detectChanges();
        httpMock.expectOne('http://api.test/api/chat').flush({ success: true, data: [chat('c1')] });
        fixture.detectChanges();

        const item = (fixture.nativeElement as HTMLElement).querySelector(
            '[data-testid="chat-item"]',
        ) as HTMLButtonElement;
        item.click();
        fixture.detectChanges();

        expect(openSpy).toHaveBeenCalledWith('c1');
        httpMock
            .expectOne((r) => r.url === 'http://api.test/api/chat/c1/messages')
            .flush({ success: true, data: [] });
        httpMock.expectOne('http://api.test/api/chat/c1/read').flush({ success: true, data: {} });
    });

    it('submit вызывает store.send', async () => {
        const store = TestBed.inject(ChatStore);
        const sendSpy = vi.spyOn(store, 'send').mockResolvedValue();
        store.activeChatId.set('c1');

        fixture.detectChanges();
        httpMock.expectOne('http://api.test/api/chat').flush({ success: true, data: [chat('c1')] });

        const cmp = fixture.componentInstance as unknown as {
            draft: { set(v: string): void };
            submit(e: Event): Promise<void>;
        };
        cmp.draft.set('hello');
        await cmp.submit(new Event('submit'));

        expect(sendSpy).toHaveBeenCalledWith('hello');
    });
});
