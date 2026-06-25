import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
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
    let injector: EnvironmentInjector;
    let tokenStore: TokenStore;
    const route = {} as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideRouter([])] });
        injector = TestBed.inject(EnvironmentInjector);
        tokenStore = TestBed.inject(TokenStore);
    });

    it('без токена → UrlTree на /login', () => {
        tokenStore.clear();
        const result = runInInjectionContext(injector, () => authGuard(route, state));
        const tree = result as UrlTree;
        expect(tree instanceof UrlTree).toBe(true);
        expect(tree.toString()).toBe('/login');
    });

    it('с токеном → true', () => {
        tokenStore.set('tok');
        const result = runInInjectionContext(injector, () => authGuard(route, state));
        expect(result).toBe(true);
        tokenStore.clear();
    });
});
