import type { Object } from './object';
import type { ProductsControllerSearchSort } from './productsControllerSearchSort';

export type ProductsControllerSearchParams = {
/**
 * Номер страницы (1-based)
 * @minimum 1
 */
page?: Object;
/**
 * Размер страницы
 * @minimum 1
 */
pageSize?: Object;
/**
 * Полнотекстовый поиск
 */
q?: string;
categoryId?: string;
vendorId?: string;
minPrice?: number;
maxPrice?: number;
minRating?: number;
/**
 * Только товары в наличии
 */
inStock?: boolean;
region?: string;
sort?: ProductsControllerSearchSort;
};
