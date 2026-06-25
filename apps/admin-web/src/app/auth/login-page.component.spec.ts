import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { LoginPageComponent } from './login-page.component';
import { SessionStore } from './session.store';
import { TokenStore } from './token.store';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

describe('LoginPageComponent', () => {
    let httpMock: HttpTestingController;
    let router: Router;
    let tokenStore: TokenStore;

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
        router = TestBed.inject(Router);
        tokenStore = TestBed.inject(TokenStore);
        tokenStore.clear();
    });

    afterEach(() => httpMock.verify());

    it('сабмит → login → токен в сессию → навигация на /', () => {
        const fixture = TestBed.createComponent(LoginPageComponent);
        const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        fixture.detectChanges();

        const form = (fixture.nativeElement as HTMLElement).querySelector('form');
        form?.dispatchEvent(new Event('submit'));

        const req = httpMock.expectOne('http://api.test/api/auth/login');
        expect(req.request.method).toBe('POST');
        req.flush({
            success: true,
            data: { tokens: { accessToken: 'a', refreshToken: 'r' } },
        });

        expect(TestBed.inject(SessionStore).isAuthenticated()).toBe(true);
        expect(tokenStore.get()).toBe('a');
        expect(navSpy).toHaveBeenCalledWith(['/']);
    });

    it('ошибка логина → показывает auth.error и не навигирует', () => {
        const fixture = TestBed.createComponent(LoginPageComponent);
        const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
        fixture.detectChanges();

        const form = (fixture.nativeElement as HTMLElement).querySelector('form');
        form?.dispatchEvent(new Event('submit'));

        const req = httpMock.expectOne('http://api.test/api/auth/login');
        req.flush({ message: 'bad' }, { status: 401, statusText: 'Unauthorized' });
        fixture.detectChanges();

        expect(navSpy).not.toHaveBeenCalled();
        const alert = (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]');
        expect(alert).toBeTruthy();
    });
});
