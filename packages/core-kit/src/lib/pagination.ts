import type { PaginationMeta } from '../@types';

/** Строит метаданные страницы из общего количества и параметров. */
export const buildPaginationMeta = (
    total: number,
    page: number,
    pageSize: number,
): PaginationMeta => {
    const safePageSize = pageSize > 0 ? pageSize : 1;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    return {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
};

/** Смещение для запроса по странице (1-based page). */
export const pageOffset = (page: number, pageSize: number): number =>
    Math.max(0, (page - 1) * pageSize);
