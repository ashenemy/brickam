import { computed, Injectable, inject, signal } from '@angular/core';
import { AuthApiService, type AuthTokens, type UserProfile } from './auth-api.service';
import { TokenStore } from './token.store';

/**
 * Сессия продавца поверх TokenStore. Токен живёт в памяти (dev/Bearer-фолбэк),
 * боевой токен — в httpOnly-cookie; для UI используется персистентный флаг
 * `authed`. SSR-безопасно (через TokenStore).
 *
 * Роль — НЕ из JWT-декода (токен в httpOnly-cookie, JS его не читает), а из
 * профиля GET /auth/me (см. loadProfile).
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
    private readonly tokenStore = inject(TokenStore);
    private readonly authApi = inject(AuthApiService);

    /** Профиль текущего пользователя с /auth/me (роль/права). */
    readonly profile = signal<UserProfile | null>(null);

    /** Роль текущего пользователя из профиля (или null, пока не загружен). */
    readonly role = computed(() => this.profile()?.role ?? null);

    /** Авторизован, если поднят флаг сессии или есть токен в памяти. */
    readonly isAuthenticated = computed(
        () => this.tokenStore.authed() || !!this.tokenStore.token(),
    );

    /** Сохранить выданные токены (accessToken в память) и поднять флаг. */
    applyTokens(tokens: AuthTokens): void {
        this.tokenStore.set(tokens.accessToken);
        this.tokenStore.setAuthed();
        // Сразу подтянуть роль, чтобы навигация по роли работала после логина.
        this.loadProfile();
    }

    /**
     * Загрузить профиль (роль/права) с GET /auth/me, если есть сессия.
     * При 401/ошибке — сбросить профиль и локальное состояние сессии
     * (cookie уже недействителен), НЕ кидать наружу.
     */
    loadProfile(): void {
        if (!this.isAuthenticated()) {
            this.profile.set(null);
            return;
        }
        this.authApi.me().subscribe({
            next: (profile) => this.profile.set(profile),
            error: () => {
                this.profile.set(null);
                this.tokenStore.clear();
                this.tokenStore.clearAuthed();
            },
        });
    }

    /**
     * Завершить сессию: попросить сервер очистить httpOnly-cookie
     * (POST /auth/logout, withCredentials), затем сбросить локальное состояние.
     * Навигацию на /login делает вызывающий компонент.
     */
    logout(): void {
        this.authApi.logout().subscribe({ error: () => undefined });
        this.tokenStore.clear();
        this.tokenStore.clearAuthed();
        this.profile.set(null);
    }
}
