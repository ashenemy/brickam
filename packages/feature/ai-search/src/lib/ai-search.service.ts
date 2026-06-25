import { AppConfigService } from '@brickam/config-kit';
import {
    type AiQuerySpec,
    type AiSearchResult,
    type AiSearchThemeResult,
    type AiThemeSpec,
    CatalogSearchContract,
    EmbeddingProvider,
    LlmProvider,
    type ProductSearchHit,
} from '@brickam/domain-kit';
import { Injectable } from '@nestjs/common';
import type { AiSearchCacheEntry } from '../@types';
import { buildPrompt } from './prompt.util';
import { validateQuerySpec } from './query-schema';

/** Максимум попыток получить валидный JSON от LLM перед фолбэком. */
const MAX_PARSE_ATTEMPTS = 3;
/** Лимит товаров на тему после гибридного объединения. */
const HYBRID_LIMIT = 12;
/** Стоп-слова для эвристики фолбэка (значимые слова текста → keywords). */
const STOP_WORDS = new Set([
    'и',
    'в',
    'на',
    'с',
    'по',
    'для',
    'из',
    'от',
    'до',
    'не',
    'что',
    'это',
    'как',
    'a',
    'the',
    'of',
    'for',
    'and',
    'to',
]);

/**
 * AI-поиск по описанию проекта (Foundations §13, Stage 13). LLM со строгой JSON-
 * схемой + ретраи + фолбэк → гибридный (keyword+vector) подбор по темам.
 * Внешние провайдеры (LLM/Embedding/CatalogSearch) приходят глобально по токенам
 * domain-kit — feature их не импортирует. Кеш с TTL и троттлинг платных вызовов.
 */
@Injectable()
export class AiSearchService {
    private readonly cache = new Map<string, AiSearchCacheEntry>();
    /** Метки времени (мс) платных вызовов LLM/embedding для троттлинга в минуту. */
    private paidCalls: number[] = [];

    constructor(
        private readonly llm: LlmProvider,
        private readonly embedding: EmbeddingProvider,
        private readonly catalog: CatalogSearchContract,
        private readonly config: AppConfigService,
    ) {}

    /**
     * Извлекает JSON-объект из сырого ответа LLM. Устойчив к обрамлению: пробует
     * как есть, затем по первой `{` … последней `}`. Возвращает `undefined`, если
     * валидный объект извлечь не удалось.
     */
    private extractJson(raw: string): unknown {
        const trimmed = raw.trim();
        try {
            return JSON.parse(trimmed);
        } catch {
            // следующая стратегия
        }
        const start = trimmed.indexOf('{');
        const end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            try {
                return JSON.parse(trimmed.slice(start, end + 1));
            } catch {
                return undefined;
            }
        }
        return undefined;
    }

    /** Эвристический фолбэк: одна тема из значимых слов запроса (без LLM). */
    private fallbackSpec(text: string): AiQuerySpec {
        const words = text
            .toLowerCase()
            .split(/[^\p{L}\p{N}]+/u)
            .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
        const keywords = [...new Set(words)].slice(0, 8);
        const projectType = text.trim().split(/\s+/u).slice(0, 3).join(' ') || text.trim();
        return {
            projectType: projectType || 'project',
            themes: [
                {
                    name: text.trim() || 'project',
                    materialCategories: [],
                    keywords: keywords.length > 0 ? keywords : [text.trim() || 'material'],
                },
            ],
        };
    }

    /**
     * Парсит описание проекта в строгую спецификацию через LLM. До
     * `MAX_PARSE_ATTEMPTS` попыток: `complete` → extract JSON → валидация по схеме
     * с обрезкой по `maxThemes`. Любая ошибка парса/валидации → следующая попытка
     * (промпт усиливается). После исчерпания попыток — детерминированный фолбэк,
     * гарантирующий результат.
     */
    async parseQuery(text: string): Promise<AiQuerySpec> {
        const maxThemes = this.config.ai.maxThemes;
        for (let attempt = 0; attempt < MAX_PARSE_ATTEMPTS; attempt++) {
            let prompt = buildPrompt(text, maxThemes);
            if (attempt > 0) {
                prompt = `${prompt}\n\nВажно: предыдущий ответ был невалиден. Верни ТОЛЬКО строгий JSON указанной формы.`;
            }
            try {
                this.recordPaidCall();
                const raw = await this.llm.complete(prompt);
                const obj = this.extractJson(raw);
                if (obj === undefined) {
                    continue;
                }
                return validateQuerySpec(obj, maxThemes);
            } catch {
                // невалидный JSON/форма — следующая попытка
            }
        }
        return this.fallbackSpec(text);
    }

    /**
     * Гибридный подбор товаров под тему: текстовый `keywordSearch` (+категории) и
     * `vectorSearch` по эмбеддингу `name + keywords`. Результаты объединяются с
     * приоритетом keyword-хитов, дедуплицируются по `id` и обрезаются до лимита.
     */
    async hybridForTheme(theme: AiThemeSpec): Promise<ProductSearchHit[]> {
        const keywordHits = await this.catalog.keywordSearch(
            theme.keywords,
            theme.materialCategories,
            HYBRID_LIMIT,
        );
        this.recordPaidCall();
        const vector = await this.embedding.embed(`${theme.name} ${theme.keywords.join(' ')}`);
        const vectorHits = await this.catalog.vectorSearch(vector, HYBRID_LIMIT);

        const merged: ProductSearchHit[] = [];
        const seen = new Set<string>();
        for (const hit of [...keywordHits, ...vectorHits]) {
            if (seen.has(hit.id)) {
                continue;
            }
            seen.add(hit.id);
            merged.push(hit);
            if (merged.length >= HYBRID_LIMIT) {
                break;
            }
        }
        return merged;
    }

    /**
     * Детерминированное пояснение темы (без доп. LLM-вызова — дёшево). Связывает
     * тип проекта, название темы и категории материалов.
     */
    explain(projectType: string, theme: AiThemeSpec): string {
        const categories =
            theme.materialCategories.length > 0
                ? ` Категории материалов: ${theme.materialCategories.join(', ')}.`
                : '';
        return `Для проекта «${projectType}» по теме «${theme.name}» подобраны материалы по ключевым словам: ${theme.keywords.join(', ')}.${categories}`;
    }

    /**
     * Полный AI-поиск: кеш по нормализованному тексту (TTL = ai.cacheTtlSeconds),
     * троттлинг платных вызовов (≤ ai.throttlePerMinute в минуту). При превышении
     * лимита: отдаём кеш, иначе строим результат фолбэком БЕЗ LLM. parseQuery → по
     * каждой теме hybridForTheme → группировка с пояснениями, запись в кеш.
     */
    async search(text: string): Promise<AiSearchResult> {
        const key = this.hashKey(text);
        const cached = this.readCache(key);
        if (cached) {
            return cached;
        }

        const spec = this.isThrottled() ? this.fallbackSpec(text) : await this.parseQuery(text);

        const themes: AiSearchThemeResult[] = [];
        for (const theme of spec.themes) {
            const products = this.isThrottled() ? [] : await this.hybridForTheme(theme);
            themes.push({
                name: theme.name,
                explanation: this.explain(spec.projectType, theme),
                materialCategories: theme.materialCategories,
                keywords: theme.keywords,
                products,
            });
        }

        const result: AiSearchResult = { projectType: spec.projectType, themes };
        this.writeCache(key, result);
        return result;
    }

    /** Нормализованный ключ кеша/хеш запроса. */
    private hashKey(text: string): string {
        return text.trim().toLowerCase().replace(/\s+/gu, ' ');
    }

    /** Читает кеш с проверкой TTL; протухшую запись удаляет. */
    private readCache(key: string): AiSearchResult | undefined {
        const entry = this.cache.get(key);
        if (!entry) {
            return undefined;
        }
        const ttlMs = this.config.ai.cacheTtlSeconds * 1000;
        if (ttlMs <= 0 || Date.now() - entry.at > ttlMs) {
            this.cache.delete(key);
            return undefined;
        }
        return entry.result;
    }

    /** Кладёт результат в кеш с текущей меткой времени. */
    private writeCache(key: string, result: AiSearchResult): void {
        this.cache.set(key, { result, at: Date.now() });
    }

    /** Учитывает платный вызов (LLM/embedding) в скользящем окне минуты. */
    private recordPaidCall(): void {
        const now = Date.now();
        this.paidCalls = this.paidCalls.filter((at) => now - at < 60_000);
        this.paidCalls.push(now);
    }

    /** Превышен ли лимит платных вызовов в минуту (ai.throttlePerMinute). */
    private isThrottled(): boolean {
        const limit = this.config.ai.throttlePerMinute;
        if (limit <= 0) {
            return false;
        }
        const now = Date.now();
        this.paidCalls = this.paidCalls.filter((at) => now - at < 60_000);
        return this.paidCalls.length >= limit;
    }
}
