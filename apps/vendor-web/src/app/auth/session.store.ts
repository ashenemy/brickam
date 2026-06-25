import { computed, Injectable, inject } from '@angular/core';
import type { AuthTokens } from './auth-api.service';
import { TokenStore } from './token.store';

/**
 * Сессия продавца поверх TokenStore. Признак авторизации — наличие токена;
 * applyTokens кладёт accessToken (его добавляет authInterceptor как Bearer),
 * logout очищает токен. SSR-безопасно (через TokenStore).
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
    private readonly tokenStore = inject(TokenStore);

    /** Авторизован, если в хранилище есть токен. */
    readonly isAuthenticated = computed(() => !!this.tokenStore.token());

    /** Сохранить выданные токены (используется accessToken). */
    applyTokens(tokens: AuthTokens): void {
        this.tokenStore.set(tokens.accessToken);
    }

    /** Завершить сессию. */
    logout(): void {
        this.tokenStore.clear();
    }
}
