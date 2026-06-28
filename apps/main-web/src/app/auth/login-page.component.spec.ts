import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { LoginPageComponent } from './login-page.component';
import { TokenStore } from './token.store';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('LoginPageComponent', () => {
    let fixture: ComponentFixture<LoginPageComponent>;
    let httpMock: HttpTestingController;
    let tokenStore: TokenStore;
    let router: Router;
    let el: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LoginPageComponent],
            providers: [
                provideRouter([]),
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(LoginPageComponent);
        httpMock = TestBed.inject(HttpTestingController);
        tokenStore = TestBed.inject(TokenStore);
        router = TestBed.inject(Router);
        tokenStore.clear();
        el = fixture.nativeElement as HTMLElement;
        fixture.detectChanges();
    });

    afterEach(() => httpMock.verify());

    it('сабмит вызывает api.login и при успехе кладёт токен + navigate', () => {
        const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

        const inputs = el.querySelectorAll('input');
        const phone = inputs[0] as HTMLInputElement;
        const password = inputs[1] as HTMLInputElement;
        // phone-input: нац. номер; код страны (+374, Армения по умолчанию) добавляется сам.
        phone.value = '11';
        phone.dispatchEvent(new Event('input'));
        password.value = 'pass';
        password.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        (el.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));

        const req = httpMock.expectOne('http://api.test/api/auth/login');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ phone: '+37411', password: 'pass' });
        req.flush({ success: true, data: { tokens: { accessToken: 'acc', refreshToken: 'ref' } } });
        fixture.detectChanges();

        // applyTokens() сразу тянет профиль с GET /auth/me — отвечаем заглушкой.
        httpMock
            .expectOne('http://api.test/api/auth/me')
            .flush({ success: true, data: { id: 'u1', role: 'buyer', permissions: [] } });

        expect(tokenStore.get()).toBe('acc');
        expect(navSpy).toHaveBeenCalledWith(['/']);
    });
});
