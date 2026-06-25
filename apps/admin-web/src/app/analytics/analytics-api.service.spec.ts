import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { AnalyticsApiService } from './analytics-api.service';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('AnalyticsApiService', () => {
    let service: AnalyticsApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(AnalyticsApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('summary шлёт GET /admin/analytics с from/to', () => {
        service.summary('2026-01-01', '2026-02-01').subscribe();
        const req = httpMock.expectOne(
            (r) =>
                r.url === 'http://api.test/api/admin/analytics' &&
                r.params.get('from') === '2026-01-01' &&
                r.params.get('to') === '2026-02-01',
        );
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: { gmv: 1000, platformRevenue: 50, orders: 10 } });
    });
});
