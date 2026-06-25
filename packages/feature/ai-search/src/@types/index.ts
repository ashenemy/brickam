import type { AiSearchResult } from '@brickam/domain-kit';

/** Запись кеша результата AI-поиска с моментом записи (для TTL). */
export type AiSearchCacheEntry = {
    result: AiSearchResult;
    at: number;
};
