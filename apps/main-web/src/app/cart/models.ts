import type { Localized } from '../catalog/models';

/** Снимок скидки позиции корзины (хранится бэкендом). */
export type CartDiscountSnapshot = {
    type: 'percent' | 'amount';
    value: number;
    activeFrom?: string;
    activeTo?: string;
};

/**
 * Позиция корзины (плоский контракт бэкенда). Бэкенд хранит снимок цены/скидки/
 * vendorId на момент добавления. titleSnapshot может отсутствовать — название
 * тогда подтягивается из каталога по productId.
 */
export type CartItem = {
    productId: string;
    vendorId: string;
    qty: number;
    priceSnapshot: number;
    titleSnapshot?: Localized;
    discountSnapshot?: CartDiscountSnapshot;
};

/** Корзина покупателя (ответ GET /cart). */
export type Cart = {
    buyerId?: string;
    items: CartItem[];
};

/** Пустая корзина-заглушка (для SSR/гостя/ошибки). */
export const EMPTY_CART: Cart = { items: [] };
