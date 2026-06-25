import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { AuthApiService } from './auth-api.service';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

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

    it('login шлёт POST /auth/login с {phone, password} и отдаёт data', () => {
        let result: { tokens: { accessToken: string } } | undefined;
        service.login('+37400', 'secret').subscribe((d) => {
            result = d;
        });

        const req = httpMock.expectOne('http://api.test/api/auth/login');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ phone: '+37400', password: 'secret' });

        req.flush({
            success: true,
            data: { tokens: { accessToken: 'a', refreshToken: 'r' } },
        });

        expect(result?.tokens.accessToken).toBe('a');
    });
});
