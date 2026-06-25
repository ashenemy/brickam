import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
    type ActivatedRouteSnapshot,
    provideRouter,
    type RouterStateSnapshot,
    UrlTree,
} from '@angular/router';
import { describe, expect, it } from 'vitest';
import { roleGuard } from './role.guard';
import { SessionStore } from './session.store';

/** Облегчённый стенд SessionStore: подменяем сигналы isAuthenticated/role. */
function configure(authed: boolean, role: string | null): void {
    const stub = {
        isAuthenticated: signal(authed),
        role: signal(role),
    };
    TestBed.configureTestingModule({
        providers: [provideRouter([]), { provide: SessionStore, useValue: stub }],
    });
}

function run(allowed: string[]): boolean | UrlTree {
    return TestBed.runInInjectionContext(() =>
        roleGuard(allowed)({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as boolean | UrlTree;
}

describe('roleGuard', () => {
    const allowed = ['vendor_owner', 'vendor_member'];

    it('не аутентифицирован → редирект на /login', () => {
        configure(false, null);
        const result = run(allowed);
        expect(result instanceof UrlTree).toBe(true);
        expect((result as UrlTree).toString()).toBe('/login');
    });

    it('аутентифицирован, роль подходит (vendor_member) → true', () => {
        configure(true, 'vendor_member');
        expect(run(allowed)).toBe(true);
    });

    it('аутентифицирован, роль НЕ подходит → редирект на /forbidden', () => {
        configure(true, 'buyer');
        const result = run(allowed);
        expect(result instanceof UrlTree).toBe(true);
        expect((result as UrlTree).toString()).toBe('/forbidden');
    });

    it('аутентифицирован, роль ещё не загружена (null) → пропускает (true)', () => {
        configure(true, null);
        expect(run(allowed)).toBe(true);
    });
});
