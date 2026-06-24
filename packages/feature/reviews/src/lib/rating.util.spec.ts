import { describe, expect, it } from 'vitest';
import { computeRating } from './rating.util';

describe('computeRating', () => {
    it('возвращает {0, 0} для пустого массива', () => {
        expect(computeRating([])).toEqual({ ratingAvg: 0, ratingCount: 0 });
    });

    it('считает count как длину и среднее по оценкам', () => {
        expect(computeRating([4, 4, 4])).toEqual({ ratingAvg: 4, ratingCount: 3 });
    });

    it('округляет среднее до 1 знака', () => {
        // (5 + 4 + 4) / 3 = 4.333... → 4.3
        expect(computeRating([5, 4, 4])).toEqual({ ratingAvg: 4.3, ratingCount: 3 });
        // (5 + 4) / 2 = 4.5 (точно)
        expect(computeRating([5, 4])).toEqual({ ratingAvg: 4.5, ratingCount: 2 });
        // (5 + 5 + 4) / 3 = 4.666... → 4.7
        expect(computeRating([5, 5, 4])).toEqual({ ratingAvg: 4.7, ratingCount: 3 });
    });

    it('работает для одиночной оценки', () => {
        expect(computeRating([3])).toEqual({ ratingAvg: 3, ratingCount: 1 });
    });
});
