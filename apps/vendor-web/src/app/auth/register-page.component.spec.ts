import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterPageComponent } from './register-page.component';
import { TokenStore } from './token.store';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

type RegisterCmp = {
    phone: { set(v: string): void };
    password: { set(v: string): void };
    name: { set(v: string): void };
    code: { set(v: string): void };
    step(): 'form' | 'verify';
    register(): void;
    verify(): void;
};

describe('RegisterPageComponent', () => {
    let httpMock: HttpTestingController;
    let store: TokenStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [RegisterPageComponent],
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

    it('регистрация → шаг verify → подтверждение токеном → переход в кабинет', () => {
        const router = TestBed.inject(Router);
        const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

        const fixture = TestBed.createComponent(RegisterPageComponent);
        const cmp = fixture.componentInstance as unknown as RegisterCmp;

        cmp.phone.set('+37411');
        cmp.password.set('pw');
        cmp.name.set('Анна');
        cmp.register();

        const regReq = httpMock.expectOne('http://api.test/api/auth/register');
        expect(regReq.request.body.role).toBe('vendor_owner');
        regReq.flush({ success: true, data: { otpSent: true } });
        expect(cmp.step()).toBe('verify');

        cmp.code.set('1234');
        cmp.verify();

        const otpReq = httpMock.expectOne('http://api.test/api/auth/verify-otp');
        expect(otpReq.request.body).toEqual({ phone: '+37411', code: '1234' });
        otpReq.flush({
            success: true,
            data: { tokens: { accessToken: 'a.b.c', refreshToken: 'r' } },
        });

        expect(store.get()).toBe('a.b.c');
        expect(navigate).toHaveBeenCalledWith(['/']);
        store.clear();
    });
});
