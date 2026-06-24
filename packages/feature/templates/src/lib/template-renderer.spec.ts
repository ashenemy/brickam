import { ValidationException } from '@brickam/core-kit';
import { beforeEach, describe, expect, it } from 'vitest';
import { TemplateRenderer } from './template-renderer';

describe('TemplateRenderer', () => {
    let renderer: TemplateRenderer;

    beforeEach(() => {
        renderer = new TemplateRenderer();
    });

    it('успешно рендерит шаблон с подстановкой переменных', () => {
        const out = renderer.render(
            'Code: {{code}}. Valid {{ttlMinutes}} min.',
            ['code', 'ttlMinutes'],
            {
                code: '1234',
                ttlMinutes: 5,
            },
        );
        expect(out).toBe('Code: 1234. Valid 5 min.');
    });

    it('не экранирует HTML (noEscape)', () => {
        const out = renderer.render('{{value}}', ['value'], { value: 'a & b < c' });
        expect(out).toBe('a & b < c');
    });

    it('пропущенная переменная из whitelist → ValidationException', () => {
        try {
            renderer.render('Hi {{name}}', ['name'], {});
            expect.unreachable('должно бросить');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            expect((e as ValidationException).details).toEqual({ missing: ['name'] });
        }
    });

    it('неизвестная переменная в шаблоне (вне whitelist) → ValidationException', () => {
        expect(() => renderer.render('Hi {{name}} {{extra}}', ['name'], { name: 'X' })).toThrow(
            ValidationException,
        );
    });

    it('неизвестный ключ в data (вне whitelist) → ValidationException', () => {
        try {
            renderer.render('Hi {{name}}', ['name'], { name: 'X', surprise: 'y' });
            expect.unreachable('должно бросить');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            expect((e as ValidationException).details).toEqual({ unknown: ['surprise'] });
        }
    });

    it('один шаблон на hy/ru/en даёт разные строки', () => {
        const vars = ['code'];
        const data = { code: '777' };
        const hy = renderer.render('BRICK կոդ՝ {{code}}', vars, data);
        const ru = renderer.render('Код BRICK: {{code}}', vars, data);
        const en = renderer.render('BRICK code: {{code}}', vars, data);
        expect(hy).not.toBe(ru);
        expect(ru).not.toBe(en);
        expect(hy).toContain('777');
        expect(ru).toContain('777');
        expect(en).toContain('777');
    });
});
