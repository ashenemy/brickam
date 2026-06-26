import { isPlatformBrowser } from '@angular/common';
import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';

const AUTHED_KEY = 'brickam.authed';

/**
 * Хранилище сессии. Сам JWT-токен живёт ТОЛЬКО в памяти (сигнал `token`)
 * и используется как dev/Bearer-фолбэк до перезагрузки — в localStorage он
 * НЕ персистится, поэтому XSS не сможет его украсть и сохранить. Боевой
 * токен сервер кладёт в httpOnly-cookie (JS его не читает).
 *
 * Для UI («Войти/Выйти», переживает перезагрузку) персистится лишь булев
 * флаг `authed` в localStorage (`brickam.authed`), а не сам токен.
 * Всё обращение к localStorage — только в браузере (SSR-безопасно).
 */
@Injectable({ providedIn: 'root' })
export class TokenStore {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);

    /** Access-токен в памяти (dev/Bearer-фолбэк). Не персистится. */
    readonly token = signal<string | null>(null);

    /** Флаг «пользователь вошёл» для UI. Персистится в localStorage. */
    readonly authed = signal<boolean>(this.readAuthed());

    /** Сохранить токен (только в память). */
    set(token: string): void {
        this.token.set(token);
    }

    /** Очистить токен из памяти. */
    clear(): void {
        this.token.set(null);
    }

    /** Текущее значение токена из памяти. */
    get(): string | null {
        return this.token();
    }

    /** Поднять флаг сессии и запомнить его в localStorage. */
    setAuthed(): void {
        this.authed.set(true);
        if (this.isBrowser) {
            localStorage.setItem(AUTHED_KEY, '1');
        }
    }

    /** Снять флаг сессии и удалить его из localStorage. */
    clearAuthed(): void {
        this.authed.set(false);
        if (this.isBrowser) {
            localStorage.removeItem(AUTHED_KEY);
        }
    }

    private readAuthed(): boolean {
        if (this.isBrowser) {
            return localStorage.getItem(AUTHED_KEY) === '1';
        }
        return false;
    }
}
