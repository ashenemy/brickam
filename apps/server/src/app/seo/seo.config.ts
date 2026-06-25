/**
 * Конфигурация SEO-эндпоинтов. Базовый публичный URL сайта берётся из env
 * `SITE_URL` (без хардкода); дефолт — локальный dev-фронт. `globalPrefix` —
 * префикс API (по умолчанию 'api'), чтобы ссылка на sitemap из robots.txt
 * указывала на реально доступный путь `<SITE_URL>/<prefix>/sitemap.xml`.
 */
export type SeoConfig = {
    /** Базовый публичный URL сайта (без завершающего слэша). */
    baseUrl: string;
    /** Глобальный префикс API (как в main.ts setGlobalPrefix). */
    globalPrefix: string;
};

/** DI-токен конфигурации SEO. */
export const SEO_CONFIG = Symbol('SEO_CONFIG');

/** Дефолтный базовый URL, если `SITE_URL` не задан (локальная разработка). */
export const DEFAULT_SITE_URL = 'http://localhost:4200';

/** Убирает завершающие слэши, чтобы конкатенация путей не давала '//'. */
export const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

/**
 * Собирает конфиг SEO из окружения. Без побочных эффектов кроме чтения env —
 * детерминированно при фиксированном окружении.
 */
export const loadSeoConfig = (env: NodeJS.ProcessEnv, globalPrefix: string): SeoConfig => ({
    baseUrl: stripTrailingSlash(env['SITE_URL'] ?? DEFAULT_SITE_URL),
    globalPrefix: stripTrailingSlash(globalPrefix).replace(/^\/+/, ''),
});
