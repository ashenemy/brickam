import type { Localized } from '../catalog/models';

/** Опубликованная CMS-страница (about/terms/privacy и т.п.). */
export type CmsPage = {
    slug: string;
    title: Localized;
    content: Localized;
    seoTitle?: Localized;
    seoDescription?: Localized;
};

/** Краткий элемент списка страниц. */
export type CmsPageListItem = {
    slug: string;
    title: Localized;
};

/** Конверт ответа без пагинации (как в каталоге). */
export type ApiResponse<T> = {
    success: boolean;
    data: T;
};
