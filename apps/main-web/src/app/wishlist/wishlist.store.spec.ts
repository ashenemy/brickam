import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
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

describe('WishlistStore', () => {
    let store: WishlistStore;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        store = TestBed.inject(WishlistStore);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('toggle добавляет id оптимистично и синхронизирует count', () => {
        store.toggle('p1');
        expect(store.has('p1')).toBe(true);
        expect(store.count()).toBe(1);

        const req = httpMock.expectOne('http://api.test/api/wishlist/items');
        expect(req.request.method).toBe('POST');
        req.flush(body(['p1']));

        expect(store.count()).toBe(1);
    });

    it('toggle туда-обратно убирает id (идемпотентность)', () => {
        store.toggle('p1');
        httpMock.expectOne('http://api.test/api/wishlist/items').flush(body(['p1']));
        expect(store.has('p1')).toBe(true);

        store.toggle('p1');
        expect(store.has('p1')).toBe(false);
        const del = httpMock.expectOne('http://api.test/api/wishlist/items/p1');
        expect(del.request.method).toBe('DELETE');
        del.flush(body([]));

        expect(store.count()).toBe(0);
    });

    it('load заполняет ids из GET /wishlist', () => {
        store.load();
        httpMock.expectOne('http://api.test/api/wishlist').flush(body(['a', 'b', 'c']));
        expect(store.count()).toBe(3);
        expect(store.has('b')).toBe(true);
    });
});
