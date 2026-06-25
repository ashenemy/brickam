import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { type Subscription, SubscriptionApiService } from './subscription-api.service';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function mockSub(plan: 'free' | 'pro' = 'free'): Subscription {
    return { id: 's1', vendorId: 'v1', plan };
}

describe('SubscriptionApiService', () => {
    let service: SubscriptionApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(SubscriptionApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('get шлёт GET /subscription', () => {
        let result: Subscription | undefined;
        service.get().subscribe((s) => (result = s));

        const req = httpMock.expectOne('http://api.test/api/subscription');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: mockSub() });

        expect(result?.plan).toBe('free');
    });

    it('setPlan шлёт PUT /subscription с plan', () => {
        let result: Subscription | undefined;
        service.setPlan('pro').subscribe((s) => (result = s));

        const req = httpMock.expectOne('http://api.test/api/subscription');
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ plan: 'pro' });
        req.flush({ success: true, data: mockSub('pro') });

        expect(result?.plan).toBe('pro');
    });
});
