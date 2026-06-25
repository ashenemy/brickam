import type { ProductSearchHit } from '../@types';

/**
 * Провайдер LLM (Foundations §13). Реализуют в `ai-kit` (anthropic/mock), выбор
 * по конфигу; ключи — из env. Возвращает СЫРОЙ текст — парсинг/валидацию JSON и
 * ретраи делает потребитель (`ai-search`).
 */
export abstract class LlmProvider {
    abstract readonly name: string;
    abstract complete(prompt: string): Promise<string>;
}

/**
 * Провайдер эмбеддингов (Foundations §13). Реализуют в `ai-kit` (voyage/mock).
 * `catalog` строит эмбеддинг товара, `ai-search` — эмбеддинг запроса.
 */
export abstract class EmbeddingProvider {
    abstract readonly name: string;
    abstract embed(text: string): Promise<number[]>;
}

/**
 * Контракт поиска по каталогу для гибридного подбора (Foundations §13).
 * Реализует feature `catalog`; `ai-search` зависит только от контракта.
 */
export abstract class CatalogSearchContract {
    /** Текстовый матч по ключевым словам (+ опц. категории). */
    abstract keywordSearch(
        keywords: string[],
        categorySlugs: string[],
        limit: number,
    ): Promise<ProductSearchHit[]>;
    /** Векторный поиск по products.embedding (Atlas Vector Search). */
    abstract vectorSearch(embedding: number[], limit: number): Promise<ProductSearchHit[]>;
}
