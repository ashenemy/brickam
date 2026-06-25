import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { DisputesApiService } from './disputes-api.service';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('DisputesApiService', () => {
    let service: DisputesApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(DisputesApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('list шлёт GET /disputes', () => {
        service.list().subscribe();
        const req = httpMock.expectOne('http://api.test/api/disputes');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: [] });
    });

    it('review шлёт PATCH /disputes/:id/review', () => {
        service.review('d1').subscribe();
        const req = httpMock.expectOne('http://api.test/api/disputes/d1/review');
        expect(req.request.method).toBe('PATCH');
        req.flush({ success: true, data: { id: 'd1', status: 'under_review' } });
    });

    it('resolve шлёт PATCH /disputes/:id/resolve с resolution', () => {
        service.resolve('d1', 'refund').subscribe();
        const req = httpMock.expectOne('http://api.test/api/disputes/d1/resolve');
        expect(req.request.method).toBe('PATCH');
        expect(req.request.body).toEqual({ resolution: 'refund' });
        req.flush({ success: true, data: { id: 'd1', status: 'resolved', resolution: 'refund' } });
    });
});
