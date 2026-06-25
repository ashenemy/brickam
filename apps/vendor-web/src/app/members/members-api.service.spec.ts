import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { MembersApiService, type VendorMember } from './members-api.service';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function mockMember(): VendorMember {
    return {
        id: 'm1',
        vendorId: 'v1',
        userId: 'u1',
        role: 'vendor_member',
        permissions: ['orders.view'],
    };
}

describe('MembersApiService', () => {
    let service: MembersApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(MembersApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('list шлёт GET /vendor-members', () => {
        let result: VendorMember[] | undefined;
        service.list().subscribe((items) => (result = items));

        const req = httpMock.expectOne('http://api.test/api/vendor-members');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: [mockMember()] });

        expect(result?.[0].userId).toBe('u1');
    });

    it('add шлёт POST с phone и permissions', () => {
        service.add('+37411111111', ['orders.view', 'products.manage']).subscribe();

        const req = httpMock.expectOne('http://api.test/api/vendor-members');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({
            phone: '+37411111111',
            permissions: ['orders.view', 'products.manage'],
        });
        req.flush({ success: true, data: mockMember() });
    });

    it('update шлёт PATCH /vendor-members/:userId с permissions', () => {
        service.update('u1', ['analytics.view']).subscribe();

        const req = httpMock.expectOne('http://api.test/api/vendor-members/u1');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ permissions: ['analytics.view'] });
        req.flush({ success: true, data: mockMember() });
    });

    it('remove шлёт DELETE /vendor-members/:userId', () => {
        service.remove('u1').subscribe();
        const req = httpMock.expectOne('http://api.test/api/vendor-members/u1');
        expect(req.request.method).toBe('DELETE');
        req.flush({ success: true, data: null });
    });
});
