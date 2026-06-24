/** Статус модерации отзыва. Скрытые исключаются из агрегата рейтинга. */
export type ReviewStatus = 'published' | 'hidden';

/** Отзыв (публичный API-контракт, без Mongoose-документа). */
export type ReviewContract = {
    id: string;
    orderId: string;
    vendorOrderId: string;
    buyerId: string;
    vendorId: string;
    productId?: string;
    rating: number;
    text: string;
    status: ReviewStatus;
    createdAt: Date;
    updatedAt: Date;
};

/** Агрегированный рейтинг: среднее и количество отзывов. */
export type RatingSummary = {
    ratingAvg: number;
    ratingCount: number;
};

/** Список отзывов с агрегатом рейтинга (ответ listByVendor/listByProduct). */
export type ReviewListView = RatingSummary & {
    reviews: ReviewContract[];
};
