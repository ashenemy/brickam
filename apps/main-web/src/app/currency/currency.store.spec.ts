import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { CurrencyStore } from './currency.store';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function makeStore(): { store: CurrencyStore; httpMock: HttpTestingController } {
    TestBed.configureTestingModule({
        providers: [
            provideHttpClient(withFetch()),
            provideHttpClientTesting(),
            { provide: RUNTIME_CONFIG, useValue: CONFIG },
        ],
    });
    return {
        store: TestBed.inject(CurrencyStore),
        httpMock: TestBed.inject(HttpTestingController),
    };
}

describe('CurrencyStore', () => {
    beforeEach(() => {
        localStorage.clear();
        TestBed.resetTestingModule();
    });

    it('load заполняет currencies и rates', () => {
        const { store, httpMock } = makeStore();
        store.load();
        httpMock.expectOne('http://api.test/api/currency/display-currencies').flush({
            success: true,
            data: { base: 'AMD', currencies: ['AMD', 'USD', 'RUB'] },
        });
        httpMock.expectOne('http://api.test/api/currency/rates').flush({
            success: true,
            data: [
                { currency: 'AMD', rate: 1, fetchedAt: '2026-01-01' },
                { currency: 'USD', rate: 400, fetchedAt: '2026-01-01' },
            ],
        });
        expect(store.currencies()).toEqual(['AMD', 'USD', 'RUB']);
        expect(store.rates().get('USD')).toBe(400);
        httpMock.verify();
    });

    it('load SSR-безопасен: ошибки глушатся, остаётся фолбэк AMD', () => {
        const { store, httpMock } = makeStore();
        store.load();
        httpMock
            .expectOne('http://api.test/api/currency/display-currencies')
            .error(new ProgressEvent('fail'));
        httpMock.expectOne('http://api.test/api/currency/rates').error(new ProgressEvent('fail'));
        expect(store.currencies()).toEqual(['AMD']);
        expect(store.selected()).toBe('AMD');
        httpMock.verify();
    });

    it('convert(AMD) — identity', () => {
        const { store } = makeStore();
        expect(store.convert(12000)).toBe(12000);
    });

    it('convert(USD при rate=400) = amount/400 round2', () => {
        const { store } = makeStore();
        store.rates.set(
            new Map([
                ['AMD', 1],
                ['USD', 400],
            ]),
        );
        store.select('USD');
        expect(store.convert(100000)).toBe(250);
        expect(store.convert(123456)).toBe(308.64); // 308.64 round2
    });

    it('нет курса → фолбэк на исходную сумму (identity)', () => {
        const { store } = makeStore();
        store.select('XXX');
        expect(store.convert(5000)).toBe(5000);
    });

    it('select персистит выбор в localStorage', () => {
        const { store } = makeStore();
        store.select('EUR');
        expect(localStorage.getItem('buildhub.currency')).toBe('EUR');
    });

    it('восстанавливает выбор из localStorage при старте', () => {
        localStorage.setItem('buildhub.currency', 'RUB');
        const { store } = makeStore();
        expect(store.selected()).toBe('RUB');
    });
});
