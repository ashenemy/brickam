import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { type Vendor, VendorsApiService } from './vendors-api.service';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function mockVendor(): Vendor {
    return {
        id: 'v1',
        slug: 'brick',
        name: 'BRICK',
        ownerUserId: 'u1',
        region: 'Yerevan',
        status: 'active',
        ratingAvg: 0,
        ratingCount: 0,
    };
}

describe('VendorsApiService', () => {
    let service: VendorsApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(VendorsApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('me шлёт GET /vendors/me', () => {
        let result: Vendor | undefined;
        service.me().subscribe((v) => (result = v));

        const req = httpMock.expectOne('http://api.test/api/vendors/me');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: mockVendor() });

        expect(result?.id).toBe('v1');
    });

    it('update шлёт PATCH /vendors/me с телом', () => {
        service.update({ name: 'New' }).subscribe();
        const req = httpMock.expectOne('http://api.test/api/vendors/me');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ name: 'New' });
        req.flush({ success: true, data: mockVendor() });
    });
});
