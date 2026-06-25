import { TestBed } from '@angular/core/testing';
import {
    type ActivatedRouteSnapshot,
    provideRouter,
    type RouterStateSnapshot,
    UrlTree,
} from '@angular/router';
import { authGuard } from './auth.guard';
import { TokenStore } from './token.store';

describe('authGuard', () => {
    let store: TokenStore;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideRouter([])],
        });
        store = TestBed.inject(TokenStore);
        store.clear();
    });

    function run(): boolean | UrlTree {
        return TestBed.runInInjectionContext(() =>
            authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
        ) as boolean | UrlTree;
    }

    it('без токена редиректит на /login (UrlTree)', () => {
        store.clear();
        const result = run();
        expect(result instanceof UrlTree).toBe(true);
        expect((result as UrlTree).toString()).toBe('/login');
    });

    it('с токеном пропускает (true)', () => {
        store.set('abc');
        expect(run()).toBe(true);
        store.clear();
    });
});
