import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { BulkComponent } from './bulk.component';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

/** Доступ к protected-членам компонента в тесте. */
type Probe = {
    products: { set(v: unknown[]): void };
    selectedIds: { set(v: string[]): void };
    previewResult: () => unknown;
    applyResult: () => { mode: string } | null;
    preview(): void;
    apply(): void;
};

function flushVendorMe(httpMock: HttpTestingController): void {
    const req = httpMock.expectOne('http://api.test/api/vendors/me');
    req.flush({ success: true, data: { id: 'v1' } });
}

describe('BulkComponent', () => {
    let fixture: ComponentFixture<BulkComponent>;
    let probe: Probe;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [BulkComponent],
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(BulkComponent);
        probe = fixture.componentInstance as unknown as Probe;
        httpMock = TestBed.inject(HttpTestingController);
        // конструктор грузит vendor + products
        flushVendorMe(httpMock);
        const listReq = httpMock.expectOne((r) => r.url === 'http://api.test/api/catalog/products');
        listReq.flush({
            success: true,
            data: [
                {
                    id: 'p1',
                    slug: 's',
                    vendorId: 'v1',
                    categoryId: 'c1',
                    title: { ru: 'A', hy: '', en: '' },
                    cover: { mediaType: 'image', url: 'u' },
                    price: 100,
                    finalPrice: 100,
                    unit: 'pcs',
                    stock: 5,
                    region: 'Yerevan',
                    ratingAvg: 0,
                    ratingCount: 0,
                },
            ],
        });
        fixture.detectChanges();
    });

    afterEach(() => httpMock.verify());

    it('preview вызывает /vendor-bulk/preview и рендерит таблицу до/после', () => {
        probe.selectedIds.set(['p1']);
        probe.preview();

        const req = httpMock.expectOne('http://api.test/api/vendor-bulk/preview');
        expect(req.request.method).toBe('POST');
        expect(req.request.body.productIds).toEqual(['p1']);
        req.flush({
            success: true,
            data: {
                affected: 1,
                previews: [
                    {
                        productId: 'p1',
                        title: { ru: 'A', hy: '', en: '' },
                        before: { price: 100 },
                        after: { price: 90 },
                    },
                ],
            },
        });
        fixture.detectChanges();

        const el = fixture.nativeElement as HTMLElement;
        const table = el.querySelector('[data-testid="preview-table"]');
        expect(table).toBeTruthy();
        expect(table?.textContent).toContain('100 AMD');
        expect(table?.textContent).toContain('90 AMD');
    });

    it('apply вызывает /vendor-bulk/apply и показывает mode', () => {
        probe.selectedIds.set(['p1']);
        probe.preview();
        httpMock
            .expectOne('http://api.test/api/vendor-bulk/preview')
            .flush({ success: true, data: { affected: 1, previews: [] } });
        fixture.detectChanges();

        probe.apply();
        const req = httpMock.expectOne('http://api.test/api/vendor-bulk/apply');
        expect(req.request.method).toBe('POST');
        req.flush({ success: true, data: { mode: 'queued', jobId: 'j1', affected: 1 } });

        expect(probe.applyResult()?.mode).toBe('queued');
    });
});
