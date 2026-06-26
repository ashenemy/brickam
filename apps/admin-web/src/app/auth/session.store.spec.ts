import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, type RuntimeConfig } from '@brickam/config-kit/browser';
import { SessionStore } from './session.store';
import { TokenStore } from './token.store';

const CONFIG: RuntimeConfig = {
    apiBaseUrl: 'http://api.test/api',
    defaultLang: 'ru',
    supportedLangs: ['hy', 'ru', 'en'],
};

const AUTHED_KEY = 'brickam.authed';
const ME_URL = 'http://api.test/api/auth/me';

describe('SessionStore', () => {
    let session: SessionStore;
    let tokenStore: TokenStore;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withFetch()),
                provideHttpClientTesting(),
                { provide: RUNTIME_CONFIG, useValue: CONFIG },
            ],
        });
        session = TestBed.inject(SessionStore);
        tokenStore = TestBed.inject(TokenStore);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
        localStorage.clear();
    });

    /** applyTokens сразу дёргает /auth/me — отвечаем профилем админа. */
    function flushMe(role = 'admin'): void {
        const req = httpMock.expectOne(ME_URL);
        req.flush({ success: true, data: { id: 'u1', role, permissions: [] } });
    }

    it('токен НЕ персистится в localStorage (только в памяти)', () => {
        session.applyTokens({ accessToken: 'a', refreshToken: 'r' });
        flushMe();
        expect(tokenStore.get()).toBe('a');
        expect(localStorage.getItem('brickam.token')).toBeNull();
    });

    it('applyTokens поднимает флаг, isAuthenticated и грузит роль из /auth/me', () => {
        expect(session.isAuthenticated()).toBe(false);
        session.applyTokens({ accessToken: 'a', refreshToken: 'r' });
        flushMe('admin');
        expect(tokenStore.get()).toBe('a');
        expect(session.isAuthenticated()).toBe(true);
        expect(session.role()).toBe('admin');
        expect(localStorage.getItem(AUTHED_KEY)).toBe('1');
    });

    it('loadProfile при 401 сбрасывает профиль и сессию, НЕ кидает', () => {
        session.applyTokens({ accessToken: 'a', refreshToken: 'r' });
        const req = httpMock.expectOne(ME_URL);
        req.flush({ success: false, data: null }, { status: 401, statusText: 'Unauthorized' });
        expect(session.role()).toBeNull();
        expect(session.profile()).toBeNull();
        expect(session.isAuthenticated()).toBe(false);
    });

    it('loadProfile без аутентификации не шлёт запрос', () => {
        session.loadProfile();
        httpMock.expectNone(ME_URL);
        expect(session.profile()).toBeNull();
    });

    it('logout шлёт POST /auth/logout и чистит токен/флаг/профиль', () => {
        session.applyTokens({ accessToken: 'a', refreshToken: 'r' });
        flushMe();

        session.logout();

        const req = httpMock.expectOne('http://api.test/api/auth/logout');
        expect(req.request.method).toBe('POST');
        expect(req.request.withCredentials).toBe(true);
        req.flush({ success: true, data: null });

        expect(tokenStore.get()).toBeNull();
        expect(session.isAuthenticated()).toBe(false);
        expect(session.profile()).toBeNull();
        expect(localStorage.getItem(AUTHED_KEY)).toBeNull();
    });
});
