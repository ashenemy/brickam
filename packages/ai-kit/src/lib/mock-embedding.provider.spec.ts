import { describe, expect, it } from 'vitest';
import { MOCK_EMBEDDING_DIM, MockEmbeddingProvider } from './mock-embedding.provider';

describe('MockEmbeddingProvider (Foundations §13)', () => {
    const provider = new MockEmbeddingProvider();

    it('name === mock', () => {
        expect(provider.name).toBe('mock');
    });

    it('возвращает вектор фиксированной размерности', async () => {
        const v = await provider.embed('кирпич');
        expect(v).toHaveLength(MOCK_EMBEDDING_DIM);
    });

    it('детерминирован: одинаковый текст → равные векторы', async () => {
        const a = await provider.embed('цемент М500');
        const b = await provider.embed('цемент М500');
        expect(a).toEqual(b);
    });

    it('разный текст → разные векторы', async () => {
        const a = await provider.embed('цемент');
        const b = await provider.embed('краска');
        expect(a).not.toEqual(b);
    });

    it('вектор L2-нормализован (длина ≈ 1)', async () => {
        const v = await provider.embed('гипсокартон');
        const norm = Math.sqrt(v.reduce((acc, x) => acc + x * x, 0));
        expect(norm).toBeCloseTo(1, 6);
    });

    it('пустой текст → нулевой вектор фиксированной длины', async () => {
        const v = await provider.embed('');
        expect(v).toHaveLength(MOCK_EMBEDDING_DIM);
        expect(v.every((x) => x === 0)).toBe(true);
    });
});
