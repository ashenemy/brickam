import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { SessionStore } from '../auth/session.store';
import type { WishlistData } from './models';
import { WishlistStore } from './wishlist.store';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function body(ids: string[]): { success: true; data: WishlistData } {
    return {
        success: true,
        data: {
            items: ids.map((productId) => ({ productId, addedAt: '2026-01-01' })),
            count: ids.length,
        },
    };
}

function setup(authed: boolean): { store: WishlistStore; httpMock: HttpTestingController } {
    TestBed.configureTestingModule({
        providers: [
            provideHttpClient(withFetch()),
            provideHttpClientTesting(),
            provideNoopAnimations(),
            { provide: RUNTIME_CONFIG, useValue: CONFIG },
            { provide: SessionStore, useValue: { isAuthenticated: () => authed } },
        ],
    });
    return {
        store: TestBed.inject(WishlistStore),
        httpMock: TestBed.inject(HttpTestingController),
    };
}

describe('WishlistStore', () => {
    beforeEach(() => {
        localStorage.clear();
        TestBed.resetTestingModule();
    });

    it('гость: toggle добавляет локально и пишет в localStorage, без API', () => {
        const { store, httpMock } = setup(false);
        store.toggle('p1');
        expect(store.has('p1')).toBe(true);
        expect(store.count()).toBe(1);
        expect(localStorage.getItem('brickam.wishlist')).toContain('p1');
        httpMock.verify(); // ни одного запроса
    });

    it('гость: toggle туда-обратно убирает id', () => {
        const { store } = setup(false);
        store.toggle('p1');
        store.toggle('p1');
        expect(store.has('p1')).toBe(false);
        expect(store.count()).toBe(0);
    });

    it('авторизован: toggle → POST /wishlist/items, count из ответа', () => {
        const { store, httpMock } = setup(true);
        store.toggle('p1');
        expect(store.has('p1')).toBe(true);
        const req = httpMock.expectOne('http://api.test/api/wishlist/items');
        expect(req.request.method).toBe('POST');
        req.flush(body(['p1']));
        expect(store.count()).toBe(1);
        httpMock.verify();
    });

    it('авторизован: load заполняет ids из GET /wishlist', () => {
        const { store, httpMock } = setup(true);
        store.load();
        httpMock.expectOne('http://api.test/api/wishlist').flush(body(['a', 'b', 'c']));
        expect(store.count()).toBe(3);
        expect(store.has('b')).toBe(true);
        httpMock.verify();
    });
});
