import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import type { Order } from './models';
import { OrdersApiService } from './orders-api.service';

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
    };
}

describe('OrdersApiService', () => {
    let service: OrdersApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(OrdersApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('checkout() шлёт POST /orders/checkout с deliveryAddress', () => {
        const addr = {
            label: 'Home',
            region: 'Yerevan',
            city: 'Yerevan',
            line1: 'Abovyan 1',
            phone: '+37400000000',
        };
        service.checkout(addr).subscribe();
        const req = httpMock.expectOne('http://api.test/api/orders/checkout');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ deliveryAddress: addr });
        req.flush({ success: true, data: { order: order('1'), vendorOrders: [] } });
    });

    it('pay() шлёт POST /orders/:id/pay', () => {
        service.pay('o1').subscribe();
        const req = httpMock.expectOne('http://api.test/api/orders/o1/pay');
        expect(req.request.method).toBe('POST');
        req.flush({ success: true, data: order('o1') });
    });

    it('list() собирает page/pageSize и парсит {data,meta}', () => {
        let total = -1;
        service.list(2, 5).subscribe((res) => (total = res.meta.total));
        const req = httpMock.expectOne((r) => r.url === 'http://api.test/api/orders');
        expect(req.request.params.get('page')).toBe('2');
        expect(req.request.params.get('pageSize')).toBe('5');
        req.flush({
            success: true,
            data: [order('1')],
            meta: { page: 2, pageSize: 5, total: 7, totalPages: 2, hasNext: false, hasPrev: true },
        });
        expect(total).toBe(7);
    });

    it('getById() шлёт GET /orders/:id', () => {
        let result: Order | undefined;
        service.getById('o9').subscribe((o) => (result = o));
        const req = httpMock.expectOne('http://api.test/api/orders/o9');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: order('o9') });
        expect(result?.orderNumber).toBe('BH-o9');
    });
});
