import { Injectable } from '@nestjs/common';
import { DEFAULT_LANG, type Lang, SUPPORTED_LANGS, type TranslateParams } from '../@types';
import { dictionaries } from './dictionaries';
import { translate } from './translate';

/**
 * Серверный сервис локализации. Используется, в частности, AllExceptionsFilter
 * для перевода messageKey ошибки в человекочитаемое сообщение.
 */
@Injectable()
export class I18nService {
    private defaultLang: Lang = DEFAULT_LANG;

    setDefaultLang(lang: Lang): void {
        this.defaultLang = lang;
    }

    get langs(): readonly Lang[] {
        return SUPPORTED_LANGS;
    }

    isSupported(lang: string): lang is Lang {
        return (SUPPORTED_LANGS as readonly string[]).includes(lang);
    }

    /** Нормализует заголовок Accept-Language / код в поддерживаемый язык. */
    resolveLang(input?: string | null): Lang {
        if (!input) {
            return this.defaultLang;
        }
        const code = input.split(',')[0].trim().slice(0, 2).toLowerCase();
        return this.isSupported(code) ? code : this.defaultLang;
    }

    translate(key: string, lang?: Lang, params?: TranslateParams): string {
        return translate(dictionaries[lang ?? this.defaultLang], key, params);
    }
}
