import type { Dictionary, TranslateParams } from '../@types';

const INTERPOLATION = /\{(\w+)\}/g;

/**
 * Переводит ключ по словарю с интерполяцией {param}.
 * Неизвестный ключ возвращается как есть (удобно для отладки и фолбэка).
 */
export const translate = (dict: Dictionary, key: string, params?: TranslateParams): string => {
    const template = dict[key] ?? key;
    if (!params) {
        return template;
    }
    return template.replace(INTERPOLATION, (_match, name: string) =>
        name in params ? String(params[name]) : `{${name}}`,
    );
};
