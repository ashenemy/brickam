import { describe, expect, it } from 'vitest';
import { ProductFilterQueryDto } from './dto/product-filter-query.dto';
import { buildProductFilter, buildSort } from './product-filter.builder';

const makeQuery = (over: Partial<ProductFilterQueryDto> = {}): ProductFilterQueryDto => {
    const dto = new ProductFilterQueryDto();
    dto.page = 1;
    dto.pageSize = 20;
    Object.assign(dto, over);
    return dto;
};

describe('buildProductFilter', () => {
    it('по умолчанию фильтрует только активные', () => {
        expect(buildProductFilter(makeQuery())).toEqual({ status: 'active' });
    });

    it('categoryId / vendorId / region', () => {
        const filter = buildProductFilter(
            makeQuery({ categoryId: 'c1', vendorId: 'v1', region: 'yerevan' }),
        );
        expect(filter['categoryId']).toBe('c1');
        expect(filter['vendorId']).toBe('v1');
        expect(filter['region']).toBe('yerevan');
    });

    it('minPrice/maxPrice → price gte/lte', () => {
        expect(buildProductFilter(makeQuery({ minPrice: 100, maxPrice: 500 }))['price']).toEqual({
            $gte: 100,
            $lte: 500,
        });
    });

    it('только minPrice → price gte', () => {
        expect(buildProductFilter(makeQuery({ minPrice: 100 }))['price']).toEqual({ $gte: 100 });
    });

    it('minRating → ratingAvg gte', () => {
        expect(buildProductFilter(makeQuery({ minRating: 4 }))['ratingAvg']).toEqual({ $gte: 4 });
    });

    it('inStock=true → stock gt 0', () => {
        expect(buildProductFilter(makeQuery({ inStock: true }))['stock']).toEqual({ $gt: 0 });
    });

    it('inStock=false → нет фильтра по stock', () => {
        expect(buildProductFilter(makeQuery({ inStock: false }))['stock']).toBeUndefined();
    });

    it('q → $text $search', () => {
        expect(buildProductFilter(makeQuery({ q: 'цемент' }))['$text']).toEqual({
            $search: 'цемент',
        });
    });

    it('пустой q → нет $text', () => {
        expect(buildProductFilter(makeQuery({ q: '' }))['$text']).toBeUndefined();
    });
});

describe('buildSort', () => {
    it('price_asc', () => {
        expect(buildSort('price_asc')).toEqual({ price: 1 });
    });
    it('price_desc', () => {
        expect(buildSort('price_desc')).toEqual({ price: -1 });
    });
    it('rating_desc', () => {
        expect(buildSort('rating_desc')).toEqual({ ratingAvg: -1 });
    });
    it('newest', () => {
        expect(buildSort('newest')).toEqual({ createdAt: -1 });
    });
    it('по умолчанию (undefined) → newest', () => {
        expect(buildSort(undefined)).toEqual({ createdAt: -1 });
    });
});
