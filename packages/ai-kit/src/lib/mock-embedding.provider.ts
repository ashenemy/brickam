import { EmbeddingProvider } from '@brickam/domain-kit';

/** Фиксированная размерность mock-эмбеддинга. */
export const MOCK_EMBEDDING_DIM = 256;

/**
 * Детерминированный mock эмбеддингов (Foundations §13). Используется без ключа и
 * в тестах. embed() строит нормализованный вектор фиксированной размерности из
 * хеша символов текста: одинаковый текст → одинаковый вектор, разный текст →
 * разный. Без сети.
 */
export class MockEmbeddingProvider extends EmbeddingProvider {
    readonly name = 'mock';

    async embed(text: string): Promise<number[]> {
        const vector = new Array<number>(MOCK_EMBEDDING_DIM).fill(0);

        // Распределяем вклад каждого символа по «бакету» (FNV-подобный хеш),
        // чтобы разные тексты давали разные распределения.
        let hash = 2166136261;
        for (let i = 0; i < text.length; i += 1) {
            const code = text.charCodeAt(i);
            hash = Math.imul(hash ^ code, 16777619) >>> 0;
            const bucket = hash % MOCK_EMBEDDING_DIM;
            vector[bucket] += ((code % 13) + 1) / 13;
        }

        // L2-нормализация (нулевой вектор оставляем как есть).
        const norm = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0));
        if (norm === 0) {
            return vector;
        }
        return vector.map((v) => v / norm);
    }
}
