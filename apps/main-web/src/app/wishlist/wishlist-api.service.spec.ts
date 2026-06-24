import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import type { WishlistData } from './models';
import { WishlistApiService } from './wishlist-api.service';

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

describe('WishlistApiService', () => {
    let service: WishlistApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(WishlistApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('get шлёт GET /wishlist и парсит ответ', () => {
        let count = -1;
        service.get().subscribe((d) => (count = d.count));
        const req = httpMock.expectOne('http://api.test/api/wishlist');
        expect(req.request.method).toBe('GET');
        req.flush(body(['p1', 'p2']));
        expect(count).toBe(2);
    });

    it('add шлёт POST /wishlist/items с productId', () => {
        service.add('p1').subscribe();
        const req = httpMock.expectOne('http://api.test/api/wishlist/items');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ productId: 'p1' });
        req.flush(body(['p1']));
    });

    it('remove шлёт DELETE /wishlist/items/:id', () => {
        service.remove('p1').subscribe();
        const req = httpMock.expectOne('http://api.test/api/wishlist/items/p1');
        expect(req.request.method).toBe('DELETE');
        req.flush(body([]));
    });
});
