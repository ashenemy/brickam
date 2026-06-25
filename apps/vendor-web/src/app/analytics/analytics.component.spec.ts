import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { AnalyticsComponent } from './analytics.component';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('AnalyticsComponent', () => {
    let fixture: ComponentFixture<AnalyticsComponent>;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AnalyticsComponent],
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(AnalyticsComponent);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('рендерит карточки из мок-дашборда', () => {
        const req = httpMock.expectOne((r) => r.url === 'http://api.test/api/analytics/dashboard');
        req.flush({
            success: true,
            data: {
                summary: { gmv: 100000, orders: 10, avgCheck: 10000 },
                revenueSeries: [{ date: '2026-06-01', gmv: 50000, orders: 5 }],
                statusFunnel: [{ status: 'delivered', count: 8 }],
                topProducts: [{ productId: 'p1', qty: 12, revenue: 60000 }],
            },
        });
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('[data-testid="card-gmv"]')?.textContent).toContain('100000');
        expect(el.querySelector('[data-testid="card-orders"]')?.textContent).toContain('10');
        expect(el.querySelector('[data-testid="card-avg"]')?.textContent).toContain('10000');
    });
});
