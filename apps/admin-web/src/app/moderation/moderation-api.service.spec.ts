import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { ModerationApiService } from './moderation-api.service';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('ModerationApiService', () => {
    let service: ModerationApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(ModerationApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('listVendors шлёт GET /admin/vendors со status', () => {
        service.listVendors('pending').subscribe();
        const req = httpMock.expectOne(
            (r) =>
                r.url === 'http://api.test/api/admin/vendors' &&
                r.params.get('status') === 'pending',
        );
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: [] });
    });

    it('moderateVendor шлёт PATCH .../moderate с action', () => {
        service.moderateVendor('v1', 'approve').subscribe();
        const req = httpMock.expectOne('http://api.test/api/admin/vendors/v1/moderate');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ action: 'approve' });
        req.flush({ success: true, data: { id: 'v1', name: 'X', status: 'active' } });
    });

    it('moderateProduct шлёт PATCH .../moderate с action', () => {
        service.moderateProduct('p1', 'reject').subscribe();
        const req = httpMock.expectOne('http://api.test/api/admin/products/p1/moderate');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ action: 'reject' });
        req.flush({
            success: true,
            data: {
                id: 'p1',
                slug: 's',
                vendorId: 'v1',
                title: { hy: '', ru: '', en: '' },
                status: 'active',
            },
        });
    });
});
