/** Элемент вишлиста (хранит только id товара и время добавления). */
export type WishlistItem = {
    productId: string;
    addedAt: string;
};

/** Полезная нагрузка вишлиста (список + счётчик). */
export type WishlistData = {
    items: WishlistItem[];
    count: number;
};
