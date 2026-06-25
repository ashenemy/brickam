import { computed, Injectable, inject } from '@angular/core';
import type { AuthTokens } from './auth-api.service';
import { TokenStore } from './token.store';

/**
 * Сессия админки поверх TokenStore. Признак аутентификации,
 * применение токенов после логина и выход.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
    private readonly tokenStore = inject(TokenStore);

    /** Аутентифицирован, пока в хранилище есть access-токен. */
    readonly isAuthenticated = computed(() => !!this.tokenStore.token());

    /** Применить токены после успешного входа (храним accessToken). */
    applyTokens(tokens: AuthTokens): void {
        this.tokenStore.set(tokens.accessToken);
    }

    /** Выход — очистить токен. */
    logout(): void {
        this.tokenStore.clear();
    }
}
