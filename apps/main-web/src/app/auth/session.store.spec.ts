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

const AUTHED_KEY = 'buildhub.authed';
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

    /** applyTokens сразу дёргает /auth/me — отвечаем профилем покупателя. */
    function flushMe(role = 'buyer'): void {
        const req = httpMock.expectOne(ME_URL);
        req.flush({ success: true, data: { id: 'u1', role, permissions: [] } });
    }

    it('токен НЕ персистится в localStorage (только в памяти)', () => {
        session.applyTokens({ accessToken: 'acc', refreshToken: 'ref' });
        flushMe();
        expect(tokenStore.get()).toBe('acc');
        expect(localStorage.getItem('buildhub.token')).toBeNull();
    });

    it('applyTokens кладёт accessToken, поднимает authed-флаг и isAuthenticated=true', () => {
        expect(session.isAuthenticated()).toBe(false);
        session.applyTokens({ accessToken: 'acc', refreshToken: 'ref' });
        flushMe();
        expect(tokenStore.get()).toBe('acc');
        expect(session.isAuthenticated()).toBe(true);
        expect(localStorage.getItem(AUTHED_KEY)).toBe('1');
    });

    it('applyTokens грузит профиль через /auth/me → появляется role', () => {
        session.applyTokens({ accessToken: 'acc', refreshToken: 'ref' });
        flushMe('buyer');
        expect(session.role()).toBe('buyer');
        expect(session.profile()?.id).toBe('u1');
    });

    it('loadProfile при ошибке (401) сбрасывает профиль и сессию, НЕ кидает', () => {
        session.applyTokens({ accessToken: 'acc', refreshToken: 'ref' });
        const req = httpMock.expectOne(ME_URL);
        req.flush({ success: false, data: null }, { status: 401, statusText: 'Unauthorized' });
        expect(session.role()).toBeNull();
        expect(session.profile()).toBeNull();
        expect(session.isAuthenticated()).toBe(false);
    });

    it('loadProfile без аутентификации не шлёт запрос и держит profile=null', () => {
        session.loadProfile();
        httpMock.expectNone(ME_URL);
        expect(session.profile()).toBeNull();
    });

    it('logout шлёт POST /auth/logout, чистит токен/флаг/профиль', () => {
        session.applyTokens({ accessToken: 'acc', refreshToken: 'ref' });
        flushMe();
        expect(session.isAuthenticated()).toBe(true);

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
