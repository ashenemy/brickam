import { TestBed } from '@angular/core/testing';
import { SessionStore } from './session.store';
import { TokenStore } from './token.store';

describe('SessionStore', () => {
    let session: SessionStore;
    let tokenStore: TokenStore;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        session = TestBed.inject(SessionStore);
        tokenStore = TestBed.inject(TokenStore);
        tokenStore.clear();
    });

    it('applyTokens кладёт accessToken и делает isAuthenticated=true', () => {
        expect(session.isAuthenticated()).toBe(false);
        session.applyTokens({ accessToken: 'acc', refreshToken: 'ref' });
        expect(tokenStore.get()).toBe('acc');
        expect(session.isAuthenticated()).toBe(true);
    });

    it('logout очищает токен', () => {
        session.applyTokens({ accessToken: 'acc', refreshToken: 'ref' });
        expect(session.isAuthenticated()).toBe(true);
        session.logout();
        expect(tokenStore.get()).toBeNull();
        expect(session.isAuthenticated()).toBe(false);
    });
});
