import type { Filter, SortOrder } from '@brickam/db-kit';
import type { ProductSort } from '../@types';
import type { ProductFilterQueryDto } from './dto/product-filter-query.dto';
import type { Product } from './product.schema';

/**
 * Строит Mongo-фильтр публичного листинга из query. Листинг показывает только
 * активные товары; остальные параметры — опциональны.
 */
export const buildProductFilter = (query: ProductFilterQueryDto): Filter<Product> => {
    const filter: Filter<Product> = { status: 'active' };

    if (query.categoryId !== undefined) {
        filter['categoryId'] = query.categoryId;
    }
    if (query.vendorId !== undefined) {
        filter['vendorId'] = query.vendorId;
    }
    if (query.region !== undefined) {
        filter['region'] = query.region;
    }

    const priceCond: { $gte?: number; $lte?: number } = {};
    if (query.minPrice !== undefined) {
        priceCond.$gte = query.minPrice;
    }
    if (query.maxPrice !== undefined) {
        priceCond.$lte = query.maxPrice;
    }
    if (priceCond.$gte !== undefined || priceCond.$lte !== undefined) {
        filter['price'] = priceCond;
    }

    if (query.minRating !== undefined) {
        filter['ratingAvg'] = { $gte: query.minRating };
    }
    if (query.inStock === true) {
        filter['stock'] = { $gt: 0 };
    }
    if (query.q !== undefined && query.q !== '') {
        filter['$text'] = { $search: query.q };
    }

    return filter;
};

/** Маппит вариант сортировки в объект сортировки Mongo. По умолчанию — newest. */
export const buildSort = (sort?: ProductSort): Record<string, SortOrder> => {
    switch (sort) {
        case 'price_asc':
            return { price: 1 };
        case 'price_desc':
            return { price: -1 };
        case 'rating_desc':
            return { ratingAvg: -1 };
        default:
            return { createdAt: -1 };
    }
};
