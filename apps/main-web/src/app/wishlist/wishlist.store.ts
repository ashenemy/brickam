import { isPlatformBrowser } from '@angular/common';
import { computed, Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LanguageService } from '@brickam/i18n-kit/browser';
import { catchError, of } from 'rxjs';
import { SessionStore } from '../auth/session.store';
import type { WishlistData } from './models';
import { WishlistApiService } from './wishlist-api.service';

const STORAGE_KEY = 'brickam.wishlist';

/**
 * Глобальное состояние вишлиста. Работает для всех:
 *  - гость → локально (localStorage), без API;
 *  - авторизованный → API (оптимистично, с откатом при ошибке).
 * После add/remove показывает снакбар (локализованный). Счётчик — производный.
 */
@Injectable({ providedIn: 'root' })
export class WishlistStore {
    private readonly api = inject(WishlistApiService);
    private readonly session = inject(SessionStore);
    private readonly snack = inject(MatSnackBar);
    private readonly i18n = inject(LanguageService);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    readonly ids = signal<Set<string>>(new Set<string>());
    readonly count = computed(() => this.ids().size);

    constructor() {
        // Гость — восстановить локальный вишлист сразу.
        if (this.isBrowser && !this.session.isAuthenticated()) {
            this.ids.set(new Set(this.readLocal()));
        }
    }

    /** Загрузить вишлист: авторизованный — с сервера, гость — из localStorage. */
    load(): void {
        if (this.session.isAuthenticated()) {
            this.api
                .get()
                .pipe(catchError(() => of(null)))
                .subscribe((data) => {
                    if (data) {
                        this.setFromData(data);
                    }
                });
        } else if (this.isBrowser) {
            this.ids.set(new Set(this.readLocal()));
        }
    }

    /** Есть ли товар в вишлисте. */
    has(productId: string): boolean {
        return this.ids().has(productId);
    }

    /** Переключить наличие + показать снакбар. */
    toggle(productId: string): void {
        const wasIn = this.has(productId);
        if (wasIn) {
            this.remove(productId);
        } else {
            this.add(productId);
        }
        this.notify(!wasIn);
    }

    /** Добавить: оптимистично; гость → localStorage, авторизованный → API. */
    add(productId: string): void {
        if (this.has(productId)) {
            return;
        }
        this.mutate((set) => set.add(productId));
        if (this.session.isAuthenticated()) {
            this.api
                .add(productId)
                .pipe(catchError(() => of(null)))
                .subscribe((data) => {
                    if (data) {
                        this.setFromData(data);
                    } else {
                        this.mutate((set) => set.delete(productId));
                    }
                });
        } else {
            this.persistLocal();
        }
    }

    /** Удалить: оптимистично; гость → localStorage, авторизованный → API. */
    remove(productId: string): void {
        if (!this.has(productId)) {
            return;
        }
        this.mutate((set) => set.delete(productId));
        if (this.session.isAuthenticated()) {
            this.api
                .remove(productId)
                .pipe(catchError(() => of(null)))
                .subscribe((data) => {
                    if (data) {
                        this.setFromData(data);
                    } else {
                        this.mutate((set) => set.add(productId));
                    }
                });
        } else {
            this.persistLocal();
        }
    }

    private notify(added: boolean): void {
        const message = added
            ? this.tr('wishlist.added', 'Added to wishlist')
            : this.tr('wishlist.removed', 'Removed from wishlist');
        this.snack.open(message, '', {
            duration: 2500,
            panelClass: added ? 'bh-snack-success' : 'bh-snack-info',
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
        });
    }

    private tr(key: string, fallback: string): string {
        const value = this.i18n.t(key);
        return value === key ? fallback : value;
    }

    private readLocal(): string[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? (JSON.parse(raw) as string[]) : [];
        } catch {
            return [];
        }
    }

    private persistLocal(): void {
        if (!this.isBrowser) {
            return;
        }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.ids()]));
        } catch {
            // приватный режим/недоступный storage — игнорируем
        }
    }

    private setFromData(data: WishlistData): void {
        this.ids.set(new Set(data.items.map((i) => i.productId)));
    }

    private mutate(fn: (set: Set<string>) => void): void {
        this.ids.update((prev) => {
            const next = new Set(prev);
            fn(next);
            return next;
        });
    }
}
