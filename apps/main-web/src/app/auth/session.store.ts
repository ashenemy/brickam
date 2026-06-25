import { computed, Injectable, inject } from '@angular/core';
import type { AuthTokens } from './models';
import { TokenStore } from './token.store';

/**
 * Сессия пользователя поверх TokenStore. Хранит признак аутентификации
 * (реактивно из сигнала токена), применяет/сбрасывает токены при логине/логауте.
 * SSR-безопасно — весь персист идёт через TokenStore.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
    private readonly tokenStore = inject(TokenStore);

    /** Пользователь аутентифицирован, если есть access-токен. */
    readonly isAuthenticated = computed(() => !!this.tokenStore.token());

    /** Сохранить полученные при логине/верификации токены. */
    applyTokens(tokens: AuthTokens): void {
        this.tokenStore.set(tokens.accessToken);
    }

    /** Завершить сессию — очистить токен. */
    logout(): void {
        this.tokenStore.clear();
    }
}
