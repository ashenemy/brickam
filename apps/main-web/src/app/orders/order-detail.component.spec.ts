import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { of } from 'rxjs';
import type { Order } from './models';
import { OrderDetailComponent } from './order-detail.component';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

const ORDER: Order = {
    id: 'o1',
    orderNumber: 'BH-o1',
    status: 'processing',
    subtotal: 12000,
    productDiscountTotal: 1000,
    loyaltyDiscount: 0,
    total: 11000,
    currencyShown: 'AMD',
    deliveryAddressSnapshot: {
        label: 'Home',
        region: 'Yerevan',
        city: 'Yerevan',
        line1: 'Abovyan 1',
        line2: 'apt 5',
        phone: '+37400000000',
    },
};

describe('OrderDetailComponent', () => {
    let fixture: ComponentFixture<OrderDetailComponent>;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OrderDetailComponent],
            providers: [
                provideRouter([]),
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
                {
                    provide: ActivatedRoute,
                    useValue: { paramMap: of(convertToParamMap({ id: 'o1' })) },
                },
            ],
        }).compileComponents();

        TestBed.inject(LanguageService).setLang('ru');
        fixture = TestBed.createComponent(OrderDetailComponent);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        for (const r of httpMock.match(() => true)) {
            if (!r.cancelled) {
                r.flush({ success: true, data: ORDER });
            }
        }
        httpMock.verify();
    });

    it('рендерит детали заказа: номер, статус, итог, адрес', () => {
        fixture.detectChanges();
        httpMock.expectOne('http://api.test/api/orders/o1').flush({ success: true, data: ORDER });
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).toContain('BH-o1');
        expect(el.querySelector('[data-testid="order-status"]')).toBeTruthy();
        expect(el.querySelector('[data-testid="order-total"]')).toBeTruthy();
        expect(el.querySelector('[data-testid="order-address"]')?.textContent).toContain(
            'Abovyan 1',
        );
        expect(el.querySelector('[data-testid="order-track"]')).toBeTruthy();
    });

    it('показывает «не найдено» при ошибке', () => {
        fixture.detectChanges();
        httpMock
            .expectOne('http://api.test/api/orders/o1')
            .flush('nope', { status: 404, statusText: 'Not Found' });
        fixture.detectChanges();

        // ru-словарь: «Заказ не найден»
        expect((fixture.nativeElement as HTMLElement).textContent).toContain('не найден');
    });
});
