import { describe, expect, it } from 'vitest';
import { buildPaginationMeta, pageOffset } from './pagination';

describe('pagination', () => {
    it('buildPaginationMeta считает страницы и флаги', () => {
        const meta = buildPaginationMeta(45, 2, 20);
        expect(meta).toEqual({
            page: 2,
            pageSize: 20,
            total: 45,
            totalPages: 3,
            hasNext: true,
            hasPrev: true,
        });
    });

    it('первая страница без предыдущей, последняя без следующей', () => {
        expect(buildPaginationMeta(10, 1, 20)).toMatchObject({
            hasPrev: false,
            hasNext: false,
            totalPages: 1,
        });
        expect(buildPaginationMeta(40, 2, 20)).toMatchObject({ hasNext: false, hasPrev: true });
    });

    it('пустой результат даёт хотя бы 1 страницу', () => {
        expect(buildPaginationMeta(0, 1, 20).totalPages).toBe(1);
    });

    it('pageOffset вычисляет смещение', () => {
        expect(pageOffset(1, 20)).toBe(0);
        expect(pageOffset(3, 20)).toBe(40);
        expect(pageOffset(0, 20)).toBe(0);
    });
});
