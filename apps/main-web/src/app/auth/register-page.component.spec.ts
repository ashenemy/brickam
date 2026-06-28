import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { RegisterPageComponent } from './register-page.component';
import { TokenStore } from './token.store';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('RegisterPageComponent', () => {
    let fixture: ComponentFixture<RegisterPageComponent>;
    let httpMock: HttpTestingController;
    let tokenStore: TokenStore;
    let router: Router;
    let el: HTMLElement;

    function type(input: HTMLInputElement, value: string): void {
        input.value = value;
        input.dispatchEvent(new Event('input'));
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RegisterPageComponent],
            providers: [
                provideRouter([]),
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(RegisterPageComponent);
        httpMock = TestBed.inject(HttpTestingController);
        tokenStore = TestBed.inject(TokenStore);
        router = TestBed.inject(Router);
        tokenStore.clear();
        el = fixture.nativeElement as HTMLElement;
        fixture.detectChanges();
    });

    afterEach(() => httpMock.verify());

    it('register→verify: register шлёт POST, переход к OTP, verify кладёт токен + navigate', () => {
        const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

        // Шаг 1: форма регистрации
        const inputs = el.querySelectorAll('input');
        type(inputs[0] as HTMLInputElement, 'Иван'); // name
        type(inputs[1] as HTMLInputElement, '11'); // phone (нац. номер; +374 добавит phone-input)
        type(inputs[2] as HTMLInputElement, 'pass'); // password
        fixture.detectChanges();

        (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));

        const regReq = httpMock.expectOne('http://api.test/api/auth/register');
        expect(regReq.request.method).toBe('POST');
        expect(regReq.request.body).toEqual({
            phone: '+37411',
            password: 'pass',
            name: 'Иван',
            role: 'buyer',
        });
        regReq.flush({ success: true, data: { otpSent: true } });
        fixture.detectChanges();

        // Перешли на шаг OTP
        expect(el.querySelector('[data-testid="otp-sent"]')).toBeTruthy();

        // Шаг 2: ввод кода
        const codeInput = el.querySelector('input') as HTMLInputElement;
        type(codeInput, '1234');
        fixture.detectChanges();

        (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));

        const verifyReq = httpMock.expectOne('http://api.test/api/auth/verify-otp');
        expect(verifyReq.request.method).toBe('POST');
        expect(verifyReq.request.body).toEqual({ phone: '+37411', code: '1234' });
        verifyReq.flush({
            success: true,
            data: { tokens: { accessToken: 'acc', refreshToken: 'ref' } },
        });
        fixture.detectChanges();

        // applyTokens() сразу тянет профиль с GET /auth/me — отвечаем заглушкой.
        httpMock
            .expectOne('http://api.test/api/auth/me')
            .flush({ success: true, data: { id: 'u1', role: 'buyer', permissions: [] } });

        expect(tokenStore.get()).toBe('acc');
        expect(navSpy).toHaveBeenCalledWith(['/']);
    });
});
