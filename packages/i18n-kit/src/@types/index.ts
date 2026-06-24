/** Поддерживаемые языки (hy — дефолт). */
export type Lang = 'hy' | 'ru' | 'en';

export const SUPPORTED_LANGS: readonly Lang[] = ['hy', 'ru', 'en'];
export const DEFAULT_LANG: Lang = 'hy';

/** Плоский словарь: ключ через точку → строка перевода. */
export type Dictionary = Record<string, string>;

/** Параметры интерполяции ({name} → значение). */
export type TranslateParams = Record<string, string | number>;
