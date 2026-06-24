import { isPlatformBrowser } from '@angular/common';
import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';

const STORAGE_KEY = 'buildhub.token';

/**
 * Минимальное хранилище JWT-токена. Реактивный сигнал `token`,
 * персист в localStorage (только в браузере — безопасно для SSR).
 * Логина пока нет; токен можно положить вручную через set().
 */
@Injectable({ providedIn: 'root' })
export class TokenStore {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);

    readonly token = signal<string | null>(this.read());

    /** Сохранить токен (в сигнал и localStorage). */
    set(token: string): void {
        this.token.set(token);
        if (this.isBrowser) {
            localStorage.setItem(STORAGE_KEY, token);
        }
    }

    /** Очистить токен. */
    clear(): void {
        this.token.set(null);
        if (this.isBrowser) {
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    /** Текущее значение токена. */
    get(): string | null {
        return this.token();
    }

    private read(): string | null {
        if (this.isBrowser) {
            return localStorage.getItem(STORAGE_KEY);
        }
        return null;
    }
}
