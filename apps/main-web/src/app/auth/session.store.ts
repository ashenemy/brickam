import { computed, Injectable, inject } from '@angular/core';
import { AuthApiService } from './auth-api.service';
import type { AuthTokens } from './models';
import { TokenStore } from './token.store';

/**
 * Сессия пользователя поверх TokenStore. Токен живёт в памяти (dev/Bearer-
 * фолбэк), боевой токен — в httpOnly-cookie; для UI используется персистентный
 * флаг `authed`. SSR-безопасно — весь персист идёт через TokenStore.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
    private readonly tokenStore = inject(TokenStore);
    private readonly authApi = inject(AuthApiService);

    /** Аутентифицирован, если поднят флаг сессии или есть токен в памяти. */
    readonly isAuthenticated = computed(
        () => this.tokenStore.authed() || !!this.tokenStore.token(),
    );

    /** Сохранить полученные при логине/верификации токены и поднять флаг. */
    applyTokens(tokens: AuthTokens): void {
        this.tokenStore.set(tokens.accessToken);
        this.tokenStore.setAuthed();
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
    }
}
