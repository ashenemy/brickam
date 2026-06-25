import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { OrdersApiService, type VendorOrder } from './orders-api.service';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function mockOrder(): VendorOrder {
    return {
        id: 'vo1',
        orderId: 'o1',
        vendorId: 'v1',
        items: [],
        subtotal: 10000,
        commissionPercentSnapshot: 5,
        commissionAmount: 500,
        payoutAmount: 9500,
        deliveryStatus: 'accepted',
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

    it('list шлёт GET /orders/vendor-orders', () => {
        let result: VendorOrder[] | undefined;
        service.list().subscribe((items) => (result = items));

        const req = httpMock.expectOne('http://api.test/api/orders/vendor-orders');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: [mockOrder()] });

        expect(result?.[0].id).toBe('vo1');
    });

    it('updateDelivery шлёт PATCH .../delivery со статусом', () => {
        let result: VendorOrder | undefined;
        service.updateDelivery('vo1', 'in_transit').subscribe((o) => (result = o));

        const req = httpMock.expectOne('http://api.test/api/orders/vendor-orders/vo1/delivery');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ status: 'in_transit' });
        req.flush({ success: true, data: mockOrder() });

        expect(result?.id).toBe('vo1');
    });
});
