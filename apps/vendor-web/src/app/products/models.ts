/** Конверт ответа API (как у инвойсов). */
export type ApiResponse<T> = {
    success: boolean;
    data: T;
};

/** Страница (пагинированный ответ листинга). */
export type Page<T> = {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
};

/** Мультиязычный текст. Армянский — дефолтный язык платформы. */
export type LocalizedText = {
    hy: string;
    ru: string;
    en: string;
};

/** Тип медиа обложки/галереи. */
export type MediaType = 'image' | 'video';

/** Дескриптор медиа (обложка товара). */
export type Media = {
    mediaType: MediaType;
    url: string;
    thumbnailUrl?: string;
};

/** Скидка на товар. */
export type ProductDiscount = {
    type: 'percent' | 'amount';
    value: number;
};

/** Статус товара. */
export type ProductStatus = 'draft' | 'active' | 'hidden';

/** Элемент листинга товаров вендора. */
export type ProductListItem = {
    id: string;
    slug: string;
    vendorId: string;
    categoryId: string;
    title: LocalizedText;
    cover: Media;
    price: number;
    discount?: ProductDiscount;
    finalPrice: number;
    unit: string;
    stock: number;
    region: string;
    ratingAvg: number;
    ratingCount: number;
};

/** Детальная карточка товара (расширяет листинг). */
export type ProductDetail = ProductListItem & {
    description: LocalizedText;
    gallery: Media[];
    status: ProductStatus;
};

/**
 * Тело создания товара (CreateProductDto бэкенда). slug/unit/region обязательны
 * на бэке — задаём разумные дефолты в форме.
 */
export type CreateProductPayload = {
    vendorId: string;
    categoryId: string;
    slug: string;
    title: LocalizedText;
    description: LocalizedText;
    cover: Media;
    price: number;
    discount?: ProductDiscount;
    unit: string;
    stock?: number;
    region: string;
};

/** Частичное обновление товара. */
export type UpdateProductPayload = Partial<CreateProductPayload> & {
    status?: ProductStatus;
};
