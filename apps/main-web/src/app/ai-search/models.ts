import type { Localized, Media } from '../catalog/models';

/**
 * Товар-подсказка из AI-поиска. По форме повторяет краткую карточку каталога,
 * но содержит лишь необходимый минимум полей ответа /ai/search.
 */
export type AiHit = {
    id: string;
    slug: string;
    title: Localized;
    finalPrice: number;
    unit: string;
    vendorId: string;
    categoryId: string;
    cover?: Media;
};

/** Тема результата AI-поиска (раскрывается аккордеоном). */
export type AiSearchTheme = {
    name: string;
    explanation: string;
    materialCategories: string[];
    keywords: string[];
    products: AiHit[];
};

/** Результат AI-поиска по описанию проекта. */
export type AiSearchResult = {
    projectType: string;
    themes: AiSearchTheme[];
};
