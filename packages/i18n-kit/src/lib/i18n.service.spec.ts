import { describe, expect, it } from 'vitest';
import { dictionaries } from './dictionaries';
import { I18nService } from './i18n.service';
import { translate } from './translate';

describe('translate', () => {
    it('переводит ключ по словарю', () => {
        expect(translate(dictionaries.ru, 'errors.notFound')).toBe('Не найдено');
        expect(translate(dictionaries.en, 'errors.notFound')).toBe('Not found');
    });

    it('возвращает ключ как фолбэк для неизвестного', () => {
        expect(translate(dictionaries.hy, 'errors.unknownKey')).toBe('errors.unknownKey');
    });

    it('интерполирует параметры', () => {
        const dict = { greet: 'Привет, {name}! Тебе {count} лет' };
        expect(translate(dict, 'greet', { name: 'Анна', count: 30 })).toBe(
            'Привет, Анна! Тебе 30 лет',
        );
    });

    it('оставляет {param} если значение не передано', () => {
        const dict = { x: 'Значение: {value}' };
        expect(translate(dict, 'x', { other: 1 })).toBe('Значение: {value}');
    });
});

describe('I18nService', () => {
    it('переводит ключи ошибок на всех языках', () => {
        const svc = new I18nService();
        expect(svc.translate('errors.forbidden', 'hy')).toContain('արգել');
        expect(svc.translate('errors.forbidden', 'ru')).toBe('Доступ запрещён');
        expect(svc.translate('errors.forbidden', 'en')).toBe('Access denied');
    });

    it('использует дефолтный язык (en) без явного', () => {
        const svc = new I18nService();
        expect(svc.translate('errors.notFound')).toBe(dictionaries.en['errors.notFound']);
    });

    it('setDefaultLang меняет язык по умолчанию', () => {
        const svc = new I18nService();
        svc.setDefaultLang('en');
        expect(svc.translate('errors.notFound')).toBe('Not found');
    });

    it('resolveLang нормализует Accept-Language', () => {
        const svc = new I18nService();
        expect(svc.resolveLang('ru-RU,ru;q=0.9')).toBe('ru');
        expect(svc.resolveLang('en-US')).toBe('en');
        expect(svc.resolveLang('fr')).toBe('en'); // не поддерживается → дефолт
        expect(svc.resolveLang(null)).toBe('en');
    });

    it('langs и isSupported', () => {
        const svc = new I18nService();
        expect(svc.langs).toEqual(['en', 'ru', 'hy']);
        expect(svc.isSupported('ru')).toBe(true);
        expect(svc.isSupported('de')).toBe(false);
    });
});
