import type { LocalizedText } from '@brickam/domain-kit';

/** Тип медиа (Foundations §13). Только изображение или видео. */
export type MediaType = 'image' | 'video';

/** Дескриптор медиа (обложка/галерея). */
export type MediaDescriptor = {
    mediaType: MediaType;
    url: string;
    thumbnailUrl?: string;
};

/** Тип скидки. */
export type DiscountType = 'percent' | 'amount';

/** Скидка на товар (Foundations §13). */
export type Discount = {
    type: DiscountType;
    value: number;
    activeFrom?: Date;
    activeTo?: Date;
};

/** Атрибут товара (ключ-значение). */
export type ProductAttribute = {
    key: string;
    value: string;
};

/** Статус товара. */
export type ProductStatus = 'draft' | 'active' | 'hidden';

/** Варианты сортировки листинга. */
export type ProductSort = 'price_asc' | 'price_desc' | 'rating_desc' | 'newest';

/** Элемент листинга товаров (публичный API-контракт). */
export type ProductListItem = {
    id: string;
    slug: string;
    vendorId: string;
    categoryId: string;
    title: LocalizedText;
    cover: MediaDescriptor;
    price: number;
    discount?: Discount;
    finalPrice: number;
    unit: string;
    stock: number;
    region: string;
    ratingAvg: number;
    ratingCount: number;
};

/** Детальная карточка товара (расширяет элемент листинга). */
export type ProductDetail = ProductListItem & {
    description: LocalizedText;
    gallery: MediaDescriptor[];
    attributes: ProductAttribute[];
    status: ProductStatus;
    viewsCount: number;
};

/** Категория каталога (публичный API-контракт). */
export type CategoryContract = {
    id: string;
    slug: string;
    parentId?: string;
    name: LocalizedText;
    icon?: string;
    order: number;
    calculatorType?: string;
};

/** Лимиты медиа определённого типа. */
export type MediaTypeLimits = {
    allowedFormats: string[];
    maxSizeMb: number;
    maxWidth: number;
    maxHeight: number;
    maxDurationSec?: number;
};

/** Лимиты медиа (image + video) — из platform_settings или дефолты. */
export type MediaSettings = {
    image: MediaTypeLimits;
    video: MediaTypeLimits;
};

/** Метаданные медиа-файла для валидации (приходят в DTO). */
export type MediaMeta = {
    mediaType: MediaType;
    format?: string;
    sizeBytes?: number;
    durationSec?: number;
    width?: number;
    height?: number;
};

// Реэкспорт мультиязычного текста для удобства потребителей.
export type { LocalizedText } from '@brickam/domain-kit';
