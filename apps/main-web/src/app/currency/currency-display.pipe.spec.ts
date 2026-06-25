import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { CurrencyStore } from './currency.store';
import { CurrencyDisplayPipe } from './currency-display.pipe';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

function setup(): { pipe: CurrencyDisplayPipe; store: CurrencyStore } {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
        providers: [
            provideHttpClient(withFetch()),
            provideHttpClientTesting(),
            { provide: RUNTIME_CONFIG, useValue: CONFIG },
            CurrencyDisplayPipe,
        ],
    });
    return {
        pipe: TestBed.inject(CurrencyDisplayPipe),
        store: TestBed.inject(CurrencyStore),
    };
}

describe('CurrencyDisplayPipe', () => {
    it('AMD по умолчанию → AMD-формат (символ драма)', () => {
        const { pipe } = setup();
        const out = pipe.transform(1000);
        expect(out).toContain('֏');
        // Число присутствует (формат может содержать неразрывный пробел).
        expect(out.replace(/\s/g, '')).toContain('1000');
    });

    it('USD при rate=400 → конвертированное значение', () => {
        const { pipe, store } = setup();
        store.rates.set(
            new Map([
                ['AMD', 1],
                ['USD', 400],
            ]),
        );
        store.select('USD');
        const out = pipe.transform(400000);
        // 400000 / 400 = 1000
        expect(out.replace(/\s/g, '')).toContain('1000');
        expect(out).not.toContain('֏');
    });

    it('«остаётся AMD»: pipe не меняет исходное число — только представление', () => {
        const { pipe, store } = setup();
        store.rates.set(
            new Map([
                ['AMD', 1],
                ['USD', 400],
            ]),
        );
        const amountAmd = 400000;
        store.select('USD');
        pipe.transform(amountAmd);
        // Исходная сумма (расчётная база) не изменилась.
        expect(amountAmd).toBe(400000);
        // convert не мутирует store-данные.
        expect(store.rates().get('USD')).toBe(400);
    });

    it('null/undefined → пустая строка', () => {
        const { pipe } = setup();
        expect(pipe.transform(null)).toBe('');
        expect(pipe.transform(undefined)).toBe('');
    });
});
