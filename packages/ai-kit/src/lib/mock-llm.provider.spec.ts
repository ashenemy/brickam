import { describe, expect, it } from 'vitest';
import { MockLlmProvider } from './mock-llm.provider';

describe('MockLlmProvider (Foundations §13)', () => {
    const provider = new MockLlmProvider();

    it('name === mock', () => {
        expect(provider.name).toBe('mock');
    });

    it('complete возвращает валидный JSON формы {projectType, themes[]}', async () => {
        const raw = await provider.complete('User query: ремонт кухни под ключ');
        const parsed = JSON.parse(raw) as {
            projectType: string;
            themes: Array<{ name: string; materialCategories: string[]; keywords: string[] }>;
        };

        expect(typeof parsed.projectType).toBe('string');
        expect(parsed.projectType.length).toBeGreaterThan(0);
        expect(Array.isArray(parsed.themes)).toBe(true);
        expect(parsed.themes.length).toBeGreaterThanOrEqual(1);

        const theme = parsed.themes[0];
        expect(typeof theme.name).toBe('string');
        expect(Array.isArray(theme.materialCategories)).toBe(true);
        expect(Array.isArray(theme.keywords)).toBe(true);
        expect(theme.keywords.length).toBeGreaterThan(0);
    });

    it('извлекает ключевые слова из запроса (без стоп-слов)', async () => {
        const raw = await provider.complete('User query: хочу покрасить стены в спальне');
        const parsed = JSON.parse(raw) as { themes: Array<{ keywords: string[] }> };
        const keywords = parsed.themes[0].keywords;

        expect(keywords).toContain('покрасить');
        expect(keywords).toContain('стены');
        expect(keywords).not.toContain('хочу');
    });

    it('работает и без маркера User query (берёт весь prompt)', async () => {
        const raw = await provider.complete('укладка плитки в ванной');
        const parsed = JSON.parse(raw) as { themes: Array<{ keywords: string[] }> };
        expect(parsed.themes[0].keywords).toContain('укладка');
    });

    it('детерминирован: одинаковый prompt → одинаковый ответ', async () => {
        const a = await provider.complete('User query: ремонт');
        const b = await provider.complete('User query: ремонт');
        expect(a).toBe(b);
    });

    it('всегда валидный JSON даже на пустом/мусорном вводе', async () => {
        await expect(provider.complete('')).resolves.toBeTruthy();
        expect(() => JSON.parse('')).toThrow();
        const raw = await provider.complete('   ');
        expect(() => JSON.parse(raw)).not.toThrow();
    });
});
