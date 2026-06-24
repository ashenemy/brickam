import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { Subject } from 'rxjs';
import { ChatStore } from './chat.store';
import { ChatBadgeComponent } from './chat-badge.component';
import { ChatSocketService } from './chat-socket.service';
import type { ChatView } from './models';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function chat(id: string, unread: number): ChatView {
    return {
        id,
        buyerId: 'b1',
        vendorId: `v-${id}`,
        participants: ['b1', `v-${id}`],
        unread: { buyer: unread, vendor: 0 },
    };
}

class SocketMock {
    readonly messageNew$ = new Subject<unknown>();
    readonly messageRead$ = new Subject<unknown>();
    readonly unread$ = new Subject<unknown>();
    connect = vi.fn();
    join = vi.fn();
    disconnect = vi.fn();
    send = vi.fn().mockResolvedValue(undefined);
}

describe('ChatBadgeComponent', () => {
    let fixture: ComponentFixture<ChatBadgeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ChatBadgeComponent],
            providers: [
                provideRouter([]),
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
                { provide: ChatSocketService, useValue: new SocketMock() },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ChatBadgeComponent);
    });

    it('показывает totalUnread', () => {
        const store = TestBed.inject(ChatStore);
        store.chats.set([chat('c1', 2), chat('c2', 1)]);
        fixture.detectChanges();

        const badge = (fixture.nativeElement as HTMLElement).querySelector('bh-badge');
        expect(badge?.textContent?.trim()).toBe('3');
    });

    it('скрывает бейдж при нуле', () => {
        TestBed.inject(ChatStore).chats.set([chat('c1', 0)]);
        fixture.detectChanges();
        expect((fixture.nativeElement as HTMLElement).querySelector('bh-badge')).toBeNull();
    });
});
