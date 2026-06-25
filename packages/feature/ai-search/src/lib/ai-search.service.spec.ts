import type {
    AiThemeSpec,
    CatalogSearchContract,
    EmbeddingProvider,
    LlmProvider,
    ProductSearchHit,
} from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiSearchService } from './ai-search.service';

const makeHit = (id: string): ProductSearchHit => ({
    id,
    slug: `slug-${id}`,
    title: { hy: id, ru: id, en: id },
    finalPrice: 100,
    unit: 'шт',
    vendorId: 'v1',
    categoryId: 'c1',
});

const validJson = JSON.stringify({
    projectType: 'Баня из бруса',
    themes: [
        { name: 'Фундамент', materialCategories: ['cement'], keywords: ['бетон', 'арматура'] },
        { name: 'Кровля', materialCategories: ['roofing'], keywords: ['черепица'] },
    ],
});

type Mocks = {
    llm: { name: string; complete: ReturnType<typeof vi.fn> };
    embedding: { name: string; embed: ReturnType<typeof vi.fn> };
    catalog: { keywordSearch: ReturnType<typeof vi.fn>; vectorSearch: ReturnType<typeof vi.fn> };
    config: { ai: { cacheTtlSeconds: number; maxThemes: number; throttlePerMinute: number } };
};

const makeMocks = (aiOver: Partial<Mocks['config']['ai']> = {}): Mocks => ({
    llm: { name: 'mock', complete: vi.fn().mockResolvedValue(validJson) },
    embedding: { name: 'mock', embed: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]) },
    catalog: {
        keywordSearch: vi.fn().mockResolvedValue([makeHit('k1'), makeHit('dup')]),
        vectorSearch: vi.fn().mockResolvedValue([makeHit('dup'), makeHit('v1')]),
    },
    config: { ai: { cacheTtlSeconds: 300, maxThemes: 6, throttlePerMinute: 60, ...aiOver } },
});

const makeService = (mocks: Mocks): AiSearchService =>
    new AiSearchService(
        mocks.llm as unknown as LlmProvider,
        mocks.embedding as unknown as EmbeddingProvider,
        mocks.catalog as unknown as CatalogSearchContract,
        mocks.config as never,
    );

describe('AiSearchService', () => {
    let mocks: Mocks;
    let service: AiSearchService;

    beforeEach(() => {
        mocks = makeMocks();
        service = makeService(mocks);
    });

    describe('parseQuery', () => {
        it('валидный JSON от мока → AiQuerySpec', async () => {
            const spec = await service.parseQuery('строю баню');
            expect(spec.projectType).toBe('Баня из бруса');
            expect(spec.themes).toHaveLength(2);
            expect(mocks.llm.complete).toHaveBeenCalledTimes(1);
        });

        it('извлекает JSON из обрамления (markdown fences)', async () => {
            mocks.llm.complete.mockResolvedValueOnce(
                `Вот ответ:\n\`\`\`json\n${validJson}\n\`\`\``,
            );
            const spec = await service.parseQuery('баня');
            expect(spec.projectType).toBe('Баня из бруса');
        });

        it('невалидный JSON на 1-й попытке, валидный на 2-й → успех (ретрай)', async () => {
            mocks.llm.complete
                .mockResolvedValueOnce('это не json вовсе')
                .mockResolvedValueOnce(validJson);
            const spec = await service.parseQuery('баня');
            expect(spec.projectType).toBe('Баня из бруса');
            expect(mocks.llm.complete).toHaveBeenCalledTimes(2);
        });

        it('кривая форма на попытках → ретрай, затем валидный', async () => {
            mocks.llm.complete
                .mockResolvedValueOnce(JSON.stringify({ projectType: '', themes: [] }))
                .mockResolvedValueOnce(validJson);
            const spec = await service.parseQuery('баня');
            expect(spec.themes).toHaveLength(2);
            expect(mocks.llm.complete).toHaveBeenCalledTimes(2);
        });

        it('все попытки невалидны → ФОЛБЭК (одна тема из текста, не падает)', async () => {
            mocks.llm.complete.mockResolvedValue('мусор без json');
            const spec = await service.parseQuery('Строю деревянную баню под ключ');
            expect(mocks.llm.complete).toHaveBeenCalledTimes(3);
            expect(spec.themes).toHaveLength(1);
            expect(spec.themes[0]?.keywords.length).toBeGreaterThan(0);
            expect(spec.projectType.length).toBeGreaterThan(0);
        });
    });

    describe('hybridForTheme', () => {
        const theme: AiThemeSpec = {
            name: 'Фундамент',
            materialCategories: ['cement'],
            keywords: ['бетон'],
        };

        it('зовёт keywordSearch И vectorSearch и дедупит по id', async () => {
            const hits = await service.hybridForTheme(theme);
            expect(mocks.catalog.keywordSearch).toHaveBeenCalledWith(['бетон'], ['cement'], 12);
            expect(mocks.embedding.embed).toHaveBeenCalledTimes(1);
            expect(mocks.catalog.vectorSearch).toHaveBeenCalledTimes(1);
            const ids = hits.map((hit) => hit.id);
            expect(ids).toEqual(['k1', 'dup', 'v1']);
            expect(new Set(ids).size).toBe(ids.length);
        });
    });

    describe('explain', () => {
        it('детерминированное непустое пояснение с категориями', () => {
            const text = service.explain('Баня', {
                name: 'Кровля',
                materialCategories: ['roofing'],
                keywords: ['черепица'],
            });
            expect(text).toContain('Баня');
            expect(text).toContain('Кровля');
            expect(text).toContain('roofing');
        });
    });

    describe('search', () => {
        it('группирует по темам: explanation непустой и products присутствуют', async () => {
            const result = await service.search('строю баню');
            expect(result.projectType).toBe('Баня из бруса');
            expect(result.themes).toHaveLength(2);
            for (const theme of result.themes) {
                expect(theme.explanation.length).toBeGreaterThan(0);
                expect(theme.products.length).toBeGreaterThan(0);
            }
        });

        it('кеш: второй идентичный запрос НЕ зовёт LLM повторно', async () => {
            await service.search('строю баню');
            const llmCalls = mocks.llm.complete.mock.calls.length;
            await service.search('  Строю Баню  ');
            expect(mocks.llm.complete.mock.calls.length).toBe(llmCalls);
        });

        it('протухший кеш (TTL=0 → отключён) зовёт LLM снова', async () => {
            const local = makeMocks({ cacheTtlSeconds: 0 });
            const svc = makeService(local);
            await svc.search('баня');
            await svc.search('баня');
            expect(local.llm.complete.mock.calls.length).toBe(2);
        });

        it('троттлинг: при превышении лимита идёт фолбэк без LLM', async () => {
            const local = makeMocks({ throttlePerMinute: 1 });
            const svc = makeService(local);
            await svc.search('первый проект');
            local.llm.complete.mockClear();
            const result = await svc.search('второй другой проект');
            expect(local.llm.complete).not.toHaveBeenCalled();
            expect(result.themes).toHaveLength(1);
            expect(result.themes[0]?.products).toEqual([]);
        });
    });
});
