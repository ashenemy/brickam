import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import type { Order } from './models';
import { OrderHistoryComponent } from './order-history.component';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function order(id: string): Order {
    return {
        id,
        orderNumber: `BH-${id}`,
        status: 'paid',
        subtotal: 10000,
        productDiscountTotal: 0,
        loyaltyDiscount: 0,
        total: 10000,
        currencyShown: 'AMD',
        deliveryAddressSnapshot: {
            label: 'Home',
            region: 'Yerevan',
            city: 'Yerevan',
            line1: 'Abovyan 1',
            phone: '+37400000000',
        },
        createdAt: '2026-06-01T10:00:00.000Z',
    };
}

describe('OrderHistoryComponent', () => {
    let fixture: ComponentFixture<OrderHistoryComponent>;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OrderHistoryComponent],
            providers: [
                provideRouter([]),
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(OrderHistoryComponent);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        for (const r of httpMock.match(() => true)) {
            if (!r.cancelled) {
                r.flush({
                    success: true,
                    data: [],
                    meta: {
                        page: 1,
                        pageSize: 10,
                        total: 0,
                        totalPages: 0,
                        hasNext: false,
                        hasPrev: false,
                    },
                });
            }
        }
        httpMock.verify();
    });

    it('рендерит список заказов с номером и суммой', () => {
        fixture.detectChanges();
        httpMock
            .expectOne((r) => r.url === 'http://api.test/api/orders')
            .flush({
                success: true,
                data: [order('1'), order('2')],
                meta: {
                    page: 1,
                    pageSize: 10,
                    total: 2,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false,
                },
            });
        fixture.detectChanges();

        const rows = (fixture.nativeElement as HTMLElement).querySelectorAll(
            '[data-testid="order-row"]',
        );
        expect(rows.length).toBe(2);
        expect((fixture.nativeElement as HTMLElement).textContent).toContain('BH-1');
    });

    it('пустой список — заглушка', () => {
        fixture.detectChanges();
        httpMock
            .expectOne((r) => r.url === 'http://api.test/api/orders')
            .flush({
                success: true,
                data: [],
                meta: {
                    page: 1,
                    pageSize: 10,
                    total: 0,
                    totalPages: 0,
                    hasNext: false,
                    hasPrev: false,
                },
            });
        fixture.detectChanges();

        expect(
            (fixture.nativeElement as HTMLElement).querySelector('[data-testid="orders-empty"]'),
        ).toBeTruthy();
    });
});
