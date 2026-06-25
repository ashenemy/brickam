import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthApiService } from './auth-api.service';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

const TOKENS = { accessToken: 'a.b.c', refreshToken: 'r.e.f' };

describe('AuthApiService', () => {
    let service: AuthApiService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        service = TestBed.inject(AuthApiService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('register шлёт POST /auth/register с role vendor_owner', () => {
        let result: { otpSent: boolean } | undefined;
        service.register('+37411', 'pw', 'Анна').subscribe((r) => (result = r));

        const req = httpMock.expectOne('http://api.test/api/auth/register');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({
            phone: '+37411',
            password: 'pw',
            name: 'Анна',
            role: 'vendor_owner',
        });
        req.flush({ success: true, data: { otpSent: true } });

        expect(result?.otpSent).toBe(true);
    });

    it('login шлёт POST /auth/login и возвращает токены', () => {
        let tokens: { tokens: typeof TOKENS } | undefined;
        service.login('+37411', 'pw').subscribe((r) => (tokens = r));

        const req = httpMock.expectOne('http://api.test/api/auth/login');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ phone: '+37411', password: 'pw' });
        req.flush({ success: true, data: { tokens: TOKENS } });

        expect(tokens?.tokens.accessToken).toBe('a.b.c');
    });

    it('verifyOtp шлёт POST /auth/verify-otp и возвращает токены', () => {
        let tokens: { tokens: typeof TOKENS } | undefined;
        service.verifyOtp('+37411', '1234').subscribe((r) => (tokens = r));

        const req = httpMock.expectOne('http://api.test/api/auth/verify-otp');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ phone: '+37411', code: '1234' });
        req.flush({ success: true, data: { tokens: TOKENS } });

        expect(tokens?.tokens.accessToken).toBe('a.b.c');
    });
});
