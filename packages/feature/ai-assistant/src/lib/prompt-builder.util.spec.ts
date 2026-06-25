import type { AiPrompts, ProductAiContext } from '@brickam/domain-kit';
import { describe, expect, it } from 'vitest';
import { buildPrompt } from './prompt-builder.util';

const prompts: AiPrompts = {
    description: 'Базовый шаблон описания',
    image: 'Базовый шаблон картинки',
    video: 'Базовый шаблон видео',
};

const ctx: ProductAiContext = {
    title: { hy: 'Ցեմենտ', ru: 'Цемент', en: 'Cement' },
    description: { hy: '', ru: 'Прочный цемент', en: '' },
    categoryId: 'cat-1',
    gallery: ['https://img/1.jpg'],
};

describe('buildPrompt', () => {
    it('description: шаблон + промпт продавца + контекст склеиваются', () => {
        const result = buildPrompt('description', prompts, 'сделай продающим', ctx);
        expect(result).toContain('Базовый шаблон описания');
        expect(result).toContain('Запрос продавца: сделай продающим');
        expect(result).toContain('Название (ru): Цемент');
        expect(result).toContain('Название (en): Cement');
        expect(result).toContain('Описание: Прочный цемент');
        expect(result).toContain('Категория: cat-1');
    });

    it('image: берёт базовый шаблон image', () => {
        const result = buildPrompt('image', prompts, 'на белом фоне', ctx);
        expect(result).toContain('Базовый шаблон картинки');
        expect(result).toContain('Запрос продавца: на белом фоне');
    });

    it('video: берёт базовый шаблон video', () => {
        const result = buildPrompt('video', prompts, 'слайдшоу', ctx);
        expect(result).toContain('Базовый шаблон видео');
        expect(result).toContain('Запрос продавца: слайдшоу');
    });

    it('без контекста (null) не падает и не добавляет блок товара', () => {
        const result = buildPrompt('description', prompts, 'просто текст', null);
        expect(result).toContain('Базовый шаблон описания');
        expect(result).toContain('Запрос продавца: просто текст');
        expect(result).not.toContain('Контекст товара');
    });

    it('детерминирован: одинаковый ввод → одинаковый вывод', () => {
        const a = buildPrompt('image', prompts, 'p', ctx);
        const b = buildPrompt('image', prompts, 'p', ctx);
        expect(a).toBe(b);
    });
});
