import type { Lang } from '@brickam/i18n-kit/browser';

/** Локализованная строка (все поддерживаемые языки). */
export type Localized = Record<Lang, string>;

/** Категория каталога (дерево через parentId). */
export type Category = {
    id: string;
    slug: string;
    parentId?: string;
    name: Localized;
    icon?: string;
    order: number;
    calculatorType?: string;
    coverUrl?: string;
    featuredOnHome?: boolean;
};

/** Тип медиа обложки/галереи. */
export type MediaType = 'image' | 'video';

/** Медиа-ресурс (обложка или элемент галереи). */
export type Media = {
    mediaType: MediaType;
    url: string;
    thumbnailUrl?: string;
};

/** Элемент списка товаров (краткая карточка). */
export type ProductListItem = {
    id: string;
    slug: string;
    vendorId: string;
    categoryId: string;
    title: Localized;
    cover: Media;
    price: number;
    discount?: number;
    finalPrice: number;
    unit: string;
    stock: number;
    region: string;
    ratingAvg: number;
    ratingCount: number;
};

/** Пара атрибут/значение в карточке товара. */
export type ProductAttribute = {
    key: string;
    value: string;
};

/** Полная карточка товара (детальная страница). */
export type ProductDetail = ProductListItem & {
    description: Localized;
    gallery: Media[];
    attributes: ProductAttribute[];
    status: string;
    viewsCount: number;
};

/** Сортировка списка товаров. */
export type ProductSort = 'price_asc' | 'price_desc' | 'rating_desc' | 'newest';

/** Фильтры запроса списка товаров. */
export type ProductFilters = {
    page?: number;
    pageSize?: number;
    q?: string;
    categoryId?: string;
    vendorId?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStock?: boolean;
    region?: string;
    sort?: ProductSort;
};

/** Метаданные пагинации. */
export type PageMeta = {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
};

/** Конверт ответа без пагинации. */
export type ApiResponse<T> = {
    success: boolean;
    data: T;
};

/** Конверт ответа списка товаров (с meta). */
export type ApiListResponse<T> = ApiResponse<T[]> & {
    meta: PageMeta;
};

/** Результат getProducts: список + метаданные. */
export type ProductListResult = {
    data: ProductListItem[];
    meta: PageMeta;
};
