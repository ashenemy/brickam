import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { SessionStore } from '../auth/session.store';
import { CartStore } from '../cart/cart.store';
import { CheckoutPageComponent } from './checkout-page.component';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('CheckoutPageComponent', () => {
    let fixture: ComponentFixture<CheckoutPageComponent>;
    let httpMock: HttpTestingController;
    let store: CartStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CheckoutPageComponent],
            providers: [
                provideRouter([]),
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                provideNoopAnimations(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
                // Оформление — для авторизованных: корзина грузится через API.
                { provide: SessionStore, useValue: { isAuthenticated: () => true } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CheckoutPageComponent);
        httpMock = TestBed.inject(HttpTestingController);
        store = TestBed.inject(CartStore);
    });

    afterEach(() => {
        for (const r of httpMock.match(() => true)) {
            if (!r.cancelled) {
                r.flush({ success: true, data: { items: [] } });
            }
        }
        httpMock.verify();
    });

    function fill(c: CheckoutPageComponent): void {
        const comp = c as unknown as {
            label: { set(v: string): void };
            region: { set(v: string): void };
            city: { set(v: string): void };
            line1: { set(v: string): void };
            phone: { set(v: string): void };
        };
        comp.label.set('Home');
        comp.region.set('Yerevan');
        comp.city.set('Yerevan');
        comp.line1.set('Abovyan 1');
        comp.phone.set('+37400000000');
    }

    it('сабмит непустой корзины: checkout → pay → navigate на /orders/:id', () => {
        const router = TestBed.inject(Router);
        const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);

        fixture.detectChanges();
        // ngOnInit -> cart.load() -> GET /cart
        httpMock.expectOne('http://api.test/api/cart').flush({
            success: true,
            data: { items: [{ productId: 'p1', vendorId: 'v1', qty: 1, priceSnapshot: 5000 }] },
        });
        fixture.detectChanges();

        fill(fixture.componentInstance);
        (fixture.componentInstance as unknown as { submit(e: Event): void }).submit(
            new Event('submit'),
        );

        const checkout = httpMock.expectOne('http://api.test/api/orders/checkout');
        expect(checkout.request.method).toBe('POST');
        expect(checkout.request.body.deliveryAddress.city).toBe('Yerevan');
        checkout.flush({
            success: true,
            data: { order: { id: 'o1', orderNumber: 'BH-1', status: 'created' }, vendorOrders: [] },
        });

        const pay = httpMock.expectOne('http://api.test/api/orders/o1/pay');
        expect(pay.request.method).toBe('POST');
        pay.flush({ success: true, data: { id: 'o1', status: 'paid' } });

        expect(nav).toHaveBeenCalledWith(['/orders', 'o1']);
        expect(store.isEmpty()).toBe(true);
    });

    it('redirect-флоу: checkout c redirectUrl → window.location.href, без pay()', () => {
        const router = TestBed.inject(Router);
        vi.spyOn(router, 'navigate').mockResolvedValue(true);
        const hrefSpy = vi.fn();
        const original = window.location;
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                ...original,
                set href(value: string) {
                    hrefSpy(value);
                },
            },
        });

        fixture.detectChanges();
        httpMock.expectOne('http://api.test/api/cart').flush({
            success: true,
            data: { items: [{ productId: 'p1', vendorId: 'v1', qty: 1, priceSnapshot: 5000 }] },
        });
        fixture.detectChanges();

        fill(fixture.componentInstance);
        (fixture.componentInstance as unknown as { submit(e: Event): void }).submit(
            new Event('submit'),
        );

        const checkout = httpMock.expectOne('http://api.test/api/orders/checkout');
        checkout.flush({
            success: true,
            data: {
                order: { id: 'o1', orderNumber: 'BH-1', status: 'created' },
                vendorOrders: [],
                payment: {
                    paymentId: 'p1',
                    status: 'pending',
                    redirectUrl: 'https://psp.test/pay/x',
                },
            },
        });

        // pay() НЕ вызывается при redirect-флоу.
        httpMock.expectNone('http://api.test/api/orders/o1/pay');
        expect(hrefSpy).toHaveBeenCalledWith('https://psp.test/pay/x');
        expect(store.isEmpty()).toBe(true);

        Object.defineProperty(window, 'location', { configurable: true, value: original });
    });

    it('пустая корзина при сабмите → редирект на /cart', () => {
        const router = TestBed.inject(Router);
        const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);

        fixture.detectChanges();
        httpMock.expectOne('http://api.test/api/cart').flush({
            success: true,
            data: { items: [] },
        });
        fixture.detectChanges();

        (fixture.componentInstance as unknown as { submit(e: Event): void }).submit(
            new Event('submit'),
        );
        expect(nav).toHaveBeenCalledWith(['/cart']);
    });
});
