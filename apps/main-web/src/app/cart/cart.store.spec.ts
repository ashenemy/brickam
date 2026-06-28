import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { SessionStore } from '../auth/session.store';
import { CartStore } from './cart.store';
import type { Cart } from './models';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function cart(items: Cart['items']): Cart {
    return { items };
}

describe('CartStore', () => {
    let store: CartStore;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                provideNoopAnimations(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
                // Корзина через API тестируется в авторизованном режиме.
                { provide: SessionStore, useValue: { isAuthenticated: () => true } },
            ],
        });
        store = TestBed.inject(CartStore);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('load() заполняет items и считает count/subtotal/total', () => {
        store.load();
        httpMock.expectOne('http://api.test/api/cart').flush({
            success: true,
            data: cart([
                { productId: 'p1', vendorId: 'v1', qty: 2, priceSnapshot: 5000 },
                { productId: 'p2', vendorId: 'v1', qty: 1, priceSnapshot: 3000 },
            ]),
        });
        expect(store.items().length).toBe(2);
        expect(store.count()).toBe(3);
        expect(store.subtotal()).toBe(13000);
        expect(store.total()).toBe(13000);
        expect(store.isEmpty()).toBe(false);
    });

    it('computed total учитывает скидку-снимок (percent)', () => {
        store.load();
        httpMock.expectOne('http://api.test/api/cart').flush({
            success: true,
            data: cart([
                {
                    productId: 'p1',
                    vendorId: 'v1',
                    qty: 2,
                    priceSnapshot: 1000,
                    discountSnapshot: { type: 'percent', value: 10 },
                },
            ]),
        });
        expect(store.subtotal()).toBe(2000);
        expect(store.discountTotal()).toBe(200); // 10% от 1000 × 2
        expect(store.total()).toBe(1800);
    });

    it('addItem() шлёт POST и обновляет сигнал ответом', () => {
        store.addItem('p1', 1);
        const req = httpMock.expectOne('http://api.test/api/cart/items');
        expect(req.request.method).toBe('POST');
        req.flush({
            success: true,
            data: cart([{ productId: 'p1', vendorId: 'v1', qty: 1, priceSnapshot: 5000 }]),
        });
        expect(store.count()).toBe(1);
    });

    it('increment() шлёт PATCH с qty+1', () => {
        store.load();
        httpMock.expectOne('http://api.test/api/cart').flush({
            success: true,
            data: cart([{ productId: 'p1', vendorId: 'v1', qty: 2, priceSnapshot: 5000 }]),
        });

        store.increment('p1');
        const req = httpMock.expectOne('http://api.test/api/cart/items/p1');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ qty: 3 });
        req.flush({
            success: true,
            data: cart([{ productId: 'p1', vendorId: 'v1', qty: 3, priceSnapshot: 5000 }]),
        });
        expect(store.count()).toBe(3);
    });

    it('decrement() до 0 шлёт DELETE (удаление позиции)', () => {
        store.load();
        httpMock.expectOne('http://api.test/api/cart').flush({
            success: true,
            data: cart([{ productId: 'p1', vendorId: 'v1', qty: 1, priceSnapshot: 5000 }]),
        });

        store.decrement('p1');
        const req = httpMock.expectOne('http://api.test/api/cart/items/p1');
        expect(req.request.method).toBe('DELETE');
        req.flush({ success: true, data: cart([]) });
        expect(store.isEmpty()).toBe(true);
    });

    it('removeItem() шлёт DELETE и обновляет сигнал', () => {
        store.removeItem('p1');
        const req = httpMock.expectOne('http://api.test/api/cart/items/p1');
        expect(req.request.method).toBe('DELETE');
        req.flush({ success: true, data: cart([]) });
        expect(store.items().length).toBe(0);
    });

    it('load() глушит ошибку (SSR/без токена)', () => {
        store.load();
        httpMock
            .expectOne('http://api.test/api/cart')
            .flush('nope', { status: 401, statusText: 'Unauthorized' });
        expect(store.items().length).toBe(0);
    });
});
