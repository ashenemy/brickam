import type { LocalizedText } from '@brickam/domain-kit';

/** Статус публикации статической страницы. */
export type PageStatus = 'draft' | 'published';

/** Статическая CMS-страница (публичный API-контракт, без Mongoose-документа). */
export type PageContract = {
    id: string;
    slug: string;
    title: LocalizedText;
    content: LocalizedText;
    status: PageStatus;
    seoTitle?: LocalizedText;
    seoDescription?: LocalizedText;
    createdAt: Date;
    updatedAt: Date;
};
