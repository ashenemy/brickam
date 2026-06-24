/** Позиция вишлиста (публичный API-контракт). */
export type WishlistItem = {
    productId: string;
    addedAt: Date;
};

/** Ответ операций вишлиста: текущие позиции и их количество. */
export type WishlistView = {
    items: WishlistItem[];
    count: number;
};
