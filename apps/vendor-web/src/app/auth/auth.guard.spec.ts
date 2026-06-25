import { TestBed } from '@angular/core/testing';
import {
    type ActivatedRouteSnapshot,
    provideRouter,
    type RouterStateSnapshot,
    UrlTree,
} from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { authGuard } from './auth.guard';
import { TokenStore } from './token.store';

describe('authGuard', () => {
    let store: TokenStore;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideRouter([])] });
        store = TestBed.inject(TokenStore);
        store.clear();
    });

    const run = () =>
        TestBed.runInInjectionContext(() =>
            authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
        );

    it('без токена редиректит на /login', () => {
        const result = run();
        expect(result).toBeInstanceOf(UrlTree);
        expect((result as UrlTree).toString()).toBe('/login');
    });

    it('с токеном пускает', () => {
        store.set('abc');
        expect(run()).toBe(true);
        store.clear();
    });
});
