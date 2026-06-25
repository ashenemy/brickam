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

    it('токен НЕ персистится в localStorage (только в памяти)', () => {
        session.applyTokens({ accessToken: 'acc', refreshToken: 'ref' });
        expect(tokenStore.get()).toBe('acc');
        expect(localStorage.getItem('buildhub.token')).toBeNull();
    });

    it('applyTokens кладёт accessToken, поднимает authed-флаг и isAuthenticated=true', () => {
        expect(session.isAuthenticated()).toBe(false);
        session.applyTokens({ accessToken: 'acc', refreshToken: 'ref' });
        expect(tokenStore.get()).toBe('acc');
        expect(session.isAuthenticated()).toBe(true);
        expect(localStorage.getItem(AUTHED_KEY)).toBe('1');
    });

    it('logout шлёт POST /auth/logout и чистит токен + флаг', () => {
        session.applyTokens({ accessToken: 'acc', refreshToken: 'ref' });
        expect(session.isAuthenticated()).toBe(true);

        session.logout();

        const req = httpMock.expectOne('http://api.test/api/auth/logout');
        expect(req.request.method).toBe('POST');
        expect(req.request.withCredentials).toBe(true);
        req.flush({ success: true, data: null });

        expect(tokenStore.get()).toBeNull();
        expect(session.isAuthenticated()).toBe(false);
        expect(localStorage.getItem(AUTHED_KEY)).toBeNull();
    });
});
