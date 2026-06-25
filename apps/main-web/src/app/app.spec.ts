import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { App } from './app';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('App', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [App],
            providers: [
                provideRouter([]),
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        }).compileComponents();
    });

    it('создаётся и рендерит шелл (navbar + footer)', async () => {
        const fixture = TestBed.createComponent(App);
        await fixture.whenStable();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('bh-navbar')).toBeTruthy();
        expect(el.querySelector('bh-footer')).toBeTruthy();
        expect(el.querySelector('app-footer')).toBeTruthy();
    });
});
