import {
    type EnvironmentProviders,
    InjectionToken,
    inject,
    type Provider,
    provideAppInitializer,
} from '@angular/core';
import { type CanActivateFn, Router, type UrlTree } from '@angular/router';

/**
 * Рантайм-конфиг фронтенда. Грузится из assets/config.json на старте
 * (APP_INITIALIZER). Никаких вшитых URL/ключей в коде — всё из этого файла,
 * который подставляется на деплое (env-specific).
 */
export type RuntimeConfig = {
    apiBaseUrl: string;
    defaultLang: 'hy' | 'ru' | 'en';
    supportedLangs: Array<'hy' | 'ru' | 'en'>;
    sentryDsn?: string;
    features?: Record<string, boolean>;
};

export const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>('RUNTIME_CONFIG');

let loaded: RuntimeConfig | null = null;

const SSR_FALLBACK: RuntimeConfig = {
    apiBaseUrl: '/api',
    defaultLang: 'hy',
    supportedLangs: ['hy', 'ru', 'en'],
};

/**
 * Загружает и кэширует рантайм-конфиг. На сервере (SSR) относительный URL не
 * резолвится — используется безопасный фолбэк; реальный конфиг грузится в браузере.
 */
export async function loadRuntimeConfig(url = '/assets/config.json'): Promise<RuntimeConfig> {
    if (typeof window === 'undefined') {
        loaded = SSR_FALLBACK;
        return loaded;
    }
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
        throw new Error(`Не удалось загрузить рантайм-конфиг ${url}: HTTP ${response.status}`);
    }
    loaded = (await response.json()) as RuntimeConfig;
    return loaded;
}

/**
 * Подключение рантайм-конфига в bootstrapApplication():
 * providers: [...provideRuntimeConfig()].
 */
export function provideRuntimeConfig(
    url = '/assets/config.json',
): Array<Provider | EnvironmentProviders> {
    return [
        {
            provide: RUNTIME_CONFIG,
            useFactory: (): RuntimeConfig => {
                if (!loaded) {
                    throw new Error(
                        'Рантайм-конфиг ещё не загружен (APP_INITIALIZER не отработал)',
                    );
                }
                return loaded;
            },
        },
        provideAppInitializer(() => loadRuntimeConfig(url)),
    ];
}

/**
 * Роль пользователя для гейта входа в приложение (Foundations §14).
 * До Stage 2 (auth-kit) роль задаётся провайдером приложения (DEV/рантайм-конфиг);
 * позже её источником станет JWT.
 */
export type Role = 'guest' | 'buyer' | 'vendor' | 'admin';

export const CURRENT_ROLE = new InjectionToken<Role>('CURRENT_ROLE');

/** Провайдит текущую роль (каждое web-приложение гейтится по своей роли). */
export function provideRole(role: Role): Provider {
    return { provide: CURRENT_ROLE, useValue: role };
}

/**
 * Guard маршрута: пускает, только если текущая роль входит в allowed,
 * иначе редиректит на /forbidden.
 */
export function roleGuard(allowed: Role[]): CanActivateFn {
    return (): boolean | UrlTree => {
        const role = inject(CURRENT_ROLE, { optional: true }) ?? 'guest';
        const router = inject(Router);
        return allowed.includes(role) ? true : router.parseUrl('/forbidden');
    };
}
