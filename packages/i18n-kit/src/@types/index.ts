/** Поддерживаемые языки (en — дефолт, совпадает с английским UI витрины). */
export type Lang = 'hy' | 'ru' | 'en';

export const SUPPORTED_LANGS: readonly Lang[] = ['en', 'ru', 'hy'];
export const DEFAULT_LANG: Lang = 'en';

/** Плоский словарь: ключ через точку → строка перевода. */
export type Dictionary = Record<string, string>;

/** Параметры интерполяции ({name} → значение). */
export type TranslateParams = Record<string, string | number>;
