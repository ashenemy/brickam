import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { type CreateProgramPayload, LoyaltyApiService } from './loyalty-api.service';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('LoyaltyApiService', () => {
    let service: LoyaltyApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(LoyaltyApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('list шлёт GET /admin/loyalty/programs', () => {
        service.list().subscribe();
        const req = httpMock.expectOne('http://api.test/api/admin/loyalty/programs');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: [] });
    });

    it('create шлёт POST /admin/loyalty/programs с basis и tiers', () => {
        const payload: CreateProgramPayload = {
            basis: 'spend',
            tiers: [
                {
                    level: 1,
                    name: 'Bronze',
                    threshold: 0,
                    discountType: 'percent',
                    discountValue: 0,
                },
            ],
        };
        service.create(payload).subscribe();
        const req = httpMock.expectOne('http://api.test/api/admin/loyalty/programs');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(payload);
        req.flush({ success: true, data: { id: 'pr1', ...payload } });
    });

    it('activate шлёт POST /admin/loyalty/programs/:id/activate', () => {
        service.activate('pr1').subscribe();
        const req = httpMock.expectOne('http://api.test/api/admin/loyalty/programs/pr1/activate');
        expect(req.request.method).toBe('POST');
        req.flush({ success: true, data: { id: 'pr1', basis: 'spend', tiers: [], active: true } });
    });
});
