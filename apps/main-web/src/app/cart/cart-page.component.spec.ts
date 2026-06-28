import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { SessionStore } from '../auth/session.store';
import { CartPageComponent } from './cart-page.component';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function flushCart(httpMock: HttpTestingController, qty = 2): void {
    httpMock.expectOne('http://api.test/api/cart').flush({
        success: true,
        data: {
            items: [
                {
                    productId: 'p1',
                    vendorId: 'v1',
                    qty,
                    priceSnapshot: 5000,
                    titleSnapshot: { hy: 'Ա', ru: 'Цемент', en: 'Cement' },
                },
            ],
        },
    });
}

describe('CartPageComponent', () => {
    let fixture: ComponentFixture<CartPageComponent>;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CartPageComponent],
            providers: [
                provideRouter([]),
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                provideNoopAnimations(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
                // Страница корзины тестируется в авторизованном режиме (через API).
                { provide: SessionStore, useValue: { isAuthenticated: () => true } },
            ],
        }).compileComponents();

        TestBed.inject(LanguageService).setLang('ru');
        fixture = TestBed.createComponent(CartPageComponent);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        for (const r of httpMock.match(() => true)) {
            if (!r.cancelled) {
                r.flush({ success: true, data: { items: [] } });
            }
        }
        httpMock.verify();
    });

    it('рендерит позиции корзины (titleSnapshot)', () => {
        fixture.detectChanges();
        flushCart(httpMock);
        fixture.detectChanges();

        const rows = (fixture.nativeElement as HTMLElement).querySelectorAll(
            '[data-testid="cart-row"]',
        );
        expect(rows.length).toBe(1);
        expect((fixture.nativeElement as HTMLElement).textContent).toContain('Цемент');
    });

    it('кнопка «+» шлёт PATCH с qty+1', () => {
        fixture.detectChanges();
        flushCart(httpMock, 2);
        fixture.detectChanges();

        const inc = (fixture.nativeElement as HTMLElement).querySelector(
            '[data-testid="cart-inc"]',
        ) as HTMLButtonElement;
        inc.click();

        const req = httpMock.expectOne('http://api.test/api/cart/items/p1');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ qty: 3 });
        req.flush({ success: true, data: { items: [] } });
    });

    it('кнопка удаления шлёт DELETE', () => {
        fixture.detectChanges();
        flushCart(httpMock);
        fixture.detectChanges();

        const rm = (fixture.nativeElement as HTMLElement).querySelector(
            '[data-testid="cart-remove"]',
        ) as HTMLButtonElement;
        rm.click();

        const req = httpMock.expectOne('http://api.test/api/cart/items/p1');
        expect(req.request.method).toBe('DELETE');
        req.flush({ success: true, data: { items: [] } });
    });

    it('кнопка «Оформить» ведёт на /checkout', () => {
        const router = TestBed.inject(Router);
        const nav = vi.spyOn(router, 'navigate').mockResolvedValue(true);

        fixture.detectChanges();
        flushCart(httpMock);
        fixture.detectChanges();

        const btn = (fixture.nativeElement as HTMLElement).querySelector(
            '[data-testid="cart-checkout"] button',
        ) as HTMLButtonElement;
        btn.click();
        expect(nav).toHaveBeenCalledWith(['/checkout']);
    });

    it('пустая корзина — заглушка с ссылкой в каталог', () => {
        fixture.detectChanges();
        httpMock.expectOne('http://api.test/api/cart').flush({
            success: true,
            data: { items: [] },
        });
        fixture.detectChanges();

        const empty = (fixture.nativeElement as HTMLElement).querySelector(
            '[data-testid="cart-empty"]',
        );
        expect(empty).toBeTruthy();
    });
});
