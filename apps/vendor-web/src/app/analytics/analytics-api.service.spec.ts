import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { AnalyticsApiService, type AnalyticsDashboard } from './analytics-api.service';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function mockDashboard(): AnalyticsDashboard {
    return {
        summary: { gmv: 100000, orders: 10, avgCheck: 10000 },
        revenueSeries: [{ date: '2026-06-01', gmv: 50000, orders: 5 }],
        statusFunnel: [{ status: 'delivered', count: 8 }],
        topProducts: [{ productId: 'p1', qty: 12, revenue: 60000 }],
    };
}

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

    it('dashboard шлёт GET /analytics/dashboard с from/to', () => {
        let result: AnalyticsDashboard | undefined;
        service.dashboard('2026-06-01', '2026-06-30').subscribe((d) => (result = d));

        const req = httpMock.expectOne(
            (r) =>
                r.url === 'http://api.test/api/analytics/dashboard' &&
                r.params.get('from') === '2026-06-01' &&
                r.params.get('to') === '2026-06-30',
        );
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: mockDashboard() });

        expect(result?.summary.gmv).toBe(100000);
    });

    it('csvUrl/xlsxUrl строят ссылки экспорта', () => {
        expect(service.csvUrl('2026-06-01', '2026-06-30')).toBe(
            'http://api.test/api/analytics/export.csv?from=2026-06-01&to=2026-06-30',
        );
        expect(service.xlsxUrl('2026-06-01', '2026-06-30')).toBe(
            'http://api.test/api/analytics/export.xlsx?from=2026-06-01&to=2026-06-30',
        );
    });
});
