import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { CurrencyApiService } from './currency-api.service';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('CurrencyApiService', () => {
    let service: CurrencyApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(CurrencyApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('rates шлёт GET /currency/rates и парсит data', () => {
        let result: { currency: string; rate: number }[] = [];
        service.rates().subscribe((r) => (result = r));
        const req = httpMock.expectOne('http://api.test/api/currency/rates');
        expect(req.request.method).toBe('GET');
        req.flush({
            success: true,
            data: [
                { currency: 'AMD', rate: 1, fetchedAt: '2026-01-01' },
                { currency: 'USD', rate: 400, fetchedAt: '2026-01-01' },
            ],
        });
        expect(result.length).toBe(2);
        expect(result[1]).toEqual({ currency: 'USD', rate: 400, fetchedAt: '2026-01-01' });
    });

    it('displayCurrencies шлёт GET /currency/display-currencies и парсит data', () => {
        let base = '';
        let currencies: string[] = [];
        service.displayCurrencies().subscribe((d) => {
            base = d.base;
            currencies = d.currencies;
        });
        const req = httpMock.expectOne('http://api.test/api/currency/display-currencies');
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: { base: 'AMD', currencies: ['AMD', 'USD', 'EUR'] } });
        expect(base).toBe('AMD');
        expect(currencies).toEqual(['AMD', 'USD', 'EUR']);
    });
});
