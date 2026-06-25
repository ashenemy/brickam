import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPageComponent } from './login-page.component';
import { TokenStore } from './token.store';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('LoginPageComponent', () => {
    let httpMock: HttpTestingController;
    let store: TokenStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [LoginPageComponent],
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                provideRouter([]),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        httpMock = TestBed.inject(HttpTestingController);
        store = TestBed.inject(TokenStore);
        store.clear();
    });

    afterEach(() => httpMock.verify());

    it('сабмит логинит и сохраняет токен + переходит в кабинет', () => {
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

        const fixture = TestBed.createComponent(LoginPageComponent);
        const cmp = fixture.componentInstance as unknown as {
            phone: { set(v: string): void };
            password: { set(v: string): void };
            submit(): void;
        };
        cmp.phone.set('+37411');
        cmp.password.set('pw');
        cmp.submit();

        const req = httpMock.expectOne('http://api.test/api/auth/login');
        expect(req.request.method).toBe('POST');
        req.flush({
            success: true,
            data: { tokens: { accessToken: 'a.b.c', refreshToken: 'r' } },
        });

        // applyTokens() сразу тянет профиль с GET /auth/me — отвечаем заглушкой.
        httpMock.expectOne('http://api.test/api/auth/me').flush({
            success: true,
            data: { id: 'u1', role: 'vendor_owner', permissions: [], vendorId: 'v1' },
        });

        expect(store.get()).toBe('a.b.c');
        expect(navigate).toHaveBeenCalledWith(['/']);
        store.clear();
    });
});
