import {
    type EnvironmentProviders,
    InjectionToken,
    type Provider,
    provideAppInitializer,
} from '@angular/core';

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
