import { ValidationException } from '@brickam/core-kit';
import { describe, expect, it } from 'vitest';
import { validateQuerySpec } from './query-schema';

const validSpec = {
    projectType: 'Баня',
    themes: [
        { name: 'Фундамент', materialCategories: ['cement'], keywords: ['бетон', 'арматура'] },
        { name: 'Кровля', materialCategories: [], keywords: ['черепица'] },
        { name: 'Отделка', materialCategories: ['paint'], keywords: ['краска'] },
    ],
};

describe('validateQuerySpec', () => {
    it('принимает валидную форму и возвращает AiQuerySpec', () => {
        const spec = validateQuerySpec(validSpec, 6);
        expect(spec.projectType).toBe('Баня');
        expect(spec.themes).toHaveLength(3);
        expect(spec.themes[0]?.keywords).toEqual(['бетон', 'арматура']);
    });

    it('отвергает кривую форму (пустой projectType)', () => {
        expect(() => validateQuerySpec({ ...validSpec, projectType: '' }, 6)).toThrow(
            ValidationException,
        );
    });

    it('отвергает тему без keywords', () => {
        const bad = {
            projectType: 'Дом',
            themes: [{ name: 'X', materialCategories: [], keywords: [] }],
        };
        expect(() => validateQuerySpec(bad, 6)).toThrow(ValidationException);
    });

    it('отвергает отсутствие тем', () => {
        expect(() => validateQuerySpec({ projectType: 'Дом', themes: [] }, 6)).toThrow(
            ValidationException,
        );
    });

    it('отвергает совсем не объект', () => {
        expect(() => validateQuerySpec('nope', 6)).toThrow(ValidationException);
    });

    it('режет число тем по maxThemes', () => {
        const spec = validateQuerySpec(validSpec, 2);
        expect(spec.themes).toHaveLength(2);
    });
});
