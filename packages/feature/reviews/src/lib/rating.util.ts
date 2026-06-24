import type { RatingSummary } from '../@types';

/**
 * Чистый расчёт агрегата рейтинга по списку оценок.
 * count = длина; ratingAvg = среднее, округлённое до 1 знака; пустой → {0, 0}.
 */
export function computeRating(ratings: number[]): RatingSummary {
    const ratingCount = ratings.length;
    if (ratingCount === 0) {
        return { ratingAvg: 0, ratingCount: 0 };
    }
    const sum = ratings.reduce((acc, value) => acc + value, 0);
    const ratingAvg = Math.round((sum / ratingCount) * 10) / 10;
    return { ratingAvg, ratingCount };
}
