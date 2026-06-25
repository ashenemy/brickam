import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { CurrencyStore } from './currency.store';
import { CurrencySwitcherComponent } from './currency-switcher.component';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('CurrencySwitcherComponent', () => {
    let fixture: ComponentFixture<CurrencySwitcherComponent>;
    let store: CurrencyStore;

    beforeEach(async () => {
        localStorage.clear();
        await TestBed.configureTestingModule({
            imports: [CurrencySwitcherComponent],
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CurrencySwitcherComponent);
        store = TestBed.inject(CurrencyStore);
    });

    it('рендерит доступные валюты в опциях селекта', () => {
        store.currencies.set(['AMD', 'USD', 'EUR']);
        fixture.detectChanges();
        const labels = (
            fixture.componentInstance as unknown as {
                options: () => { label: string; value: string }[];
            }
        ).options();
        expect(labels.map((o) => o.value)).toEqual(['AMD', 'USD', 'EUR']);
    });

    it('выбор валюты вызывает store.select', () => {
        const spy = vi.spyOn(store, 'select');
        fixture.detectChanges();
        (
            fixture.componentInstance as unknown as {
                onChange: (v: string | number) => void;
            }
        ).onChange('USD');
        expect(spy).toHaveBeenCalledWith('USD');
    });
});
