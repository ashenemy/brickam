import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { AuthApiService } from './auth-api.service';
import type { AuthResult, RegisterResult } from './models';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

const TOKENS = { accessToken: 'acc', refreshToken: 'ref' };

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

    it('register шлёт POST с phone/password/name/role=buyer и распаковывает data', () => {
        let result: RegisterResult | undefined;
        service.register('+37411', 'pass', 'Иван').subscribe((r) => (result = r));

        const req = httpMock.expectOne('http://api.test/api/auth/register');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({
            phone: '+37411',
            password: 'pass',
            name: 'Иван',
            role: 'buyer',
        });
        req.flush({ success: true, data: { otpSent: true } });
        expect(result?.otpSent).toBe(true);
    });

    it('verifyOtp шлёт POST с phone/code и распаковывает tokens', () => {
        let result: AuthResult | undefined;
        service.verifyOtp('+37411', '1234').subscribe((r) => (result = r));

        const req = httpMock.expectOne('http://api.test/api/auth/verify-otp');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ phone: '+37411', code: '1234' });
        req.flush({ success: true, data: { tokens: TOKENS } });
        expect(result?.tokens.accessToken).toBe('acc');
    });

    it('login шлёт POST с phone/password и распаковывает tokens', () => {
        let result: AuthResult | undefined;
        service.login('+37411', 'pass').subscribe((r) => (result = r));

        const req = httpMock.expectOne('http://api.test/api/auth/login');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ phone: '+37411', password: 'pass' });
        req.flush({ success: true, data: { tokens: TOKENS } });
        expect(result?.tokens.accessToken).toBe('acc');
    });
});
