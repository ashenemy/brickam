import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { BulkApiService } from './bulk-api.service';
import type { BulkApplyResult, BulkPreviewResult } from './models';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('BulkApiService', () => {
    let service: BulkApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(BulkApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('preview шлёт POST /vendor-bulk/preview с productIds и op', () => {
        let result: BulkPreviewResult | undefined;
        service
            .preview(['p1', 'p2'], { kind: 'price', mode: 'percent', value: 10 })
            .subscribe((r) => (result = r));

        const req = httpMock.expectOne('http://api.test/api/vendor-bulk/preview');
        expect(req.request.method).toBe('POST');
        expect(req.request.body.productIds).toEqual(['p1', 'p2']);
        expect(req.request.body.op.kind).toBe('price');
        req.flush({ success: true, data: { affected: 2, previews: [] } });

        expect(result?.affected).toBe(2);
    });

    it('apply шлёт POST /vendor-bulk/apply и возвращает mode', () => {
        let result: BulkApplyResult | undefined;
        service.apply(['p1'], { kind: 'discountRemove' }).subscribe((r) => (result = r));

        const req = httpMock.expectOne('http://api.test/api/vendor-bulk/apply');
        expect(req.request.method).toBe('POST');
        expect(req.request.body.op.kind).toBe('discountRemove');
        req.flush({ success: true, data: { mode: 'sync', modified: 1 } });

        expect(result?.mode).toBe('sync');
    });
});
