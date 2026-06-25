import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { CartApiService } from './cart-api.service';
import type { Cart } from './models';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

const CART: Cart = {
    items: [{ productId: 'p1', vendorId: 'v1', qty: 2, priceSnapshot: 5000 }],
};

describe('CartApiService', () => {
    let service: CartApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(CartApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('get() делает GET /cart и парсит data', () => {
        let result: Cart | undefined;
        service.get().subscribe((c) => (result = c));
        const req = httpMock.expectOne('http://api.test/api/cart');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: CART });
        expect(result?.items.length).toBe(1);
        expect(result?.items[0].productId).toBe('p1');
    });

    it('addItem() делает POST /cart/items с productId и qty', () => {
        service.addItem('p1', 3).subscribe();
        const req = httpMock.expectOne('http://api.test/api/cart/items');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ productId: 'p1', qty: 3 });
        req.flush({ success: true, data: CART });
    });

    it('addItem() по умолчанию qty=1', () => {
        service.addItem('p1').subscribe();
        const req = httpMock.expectOne('http://api.test/api/cart/items');
        expect(req.request.body).toEqual({ productId: 'p1', qty: 1 });
        req.flush({ success: true, data: CART });
    });

    it('updateQty() делает PATCH /cart/items/:id', () => {
        service.updateQty('p1', 5).subscribe();
        const req = httpMock.expectOne('http://api.test/api/cart/items/p1');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ qty: 5 });
        req.flush({ success: true, data: CART });
    });

    it('removeItem() делает DELETE /cart/items/:id', () => {
        service.removeItem('p1').subscribe();
        const req = httpMock.expectOne('http://api.test/api/cart/items/p1');
        expect(req.request.method).toBe('DELETE');
        req.flush({ success: true, data: { items: [] } });
    });

    it('clear() делает DELETE /cart', () => {
        service.clear().subscribe();
        const req = httpMock.expectOne('http://api.test/api/cart');
        expect(req.request.method).toBe('DELETE');
        req.flush({ success: true, data: { items: [] } });
    });
});
