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

    it('applyTokens сохраняет accessToken и поднимает isAuthenticated', () => {
        expect(session.isAuthenticated()).toBe(false);
        session.applyTokens({ accessToken: 'a', refreshToken: 'r' });
        expect(tokenStore.get()).toBe('a');
        expect(session.isAuthenticated()).toBe(true);
    });

    it('logout очищает токен', () => {
        session.applyTokens({ accessToken: 'a', refreshToken: 'r' });
        session.logout();
        expect(tokenStore.get()).toBeNull();
        expect(session.isAuthenticated()).toBe(false);
    });
});
