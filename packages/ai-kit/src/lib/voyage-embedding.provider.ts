import { EmbeddingProvider } from '@brickam/domain-kit';

/** Эндпойнт Voyage AI Embeddings API. */
const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings';
/** Модель эмбеддингов по умолчанию. */
const VOYAGE_MODEL = 'voyage-3';
/** Таймаут запроса (AbortController). */
const TIMEOUT_MS = 15_000;

type VoyageEmbeddingItem = { embedding?: number[] };
type VoyageResponse = { data?: VoyageEmbeddingItem[] };

/**
 * Реальный провайдер эмбеддингов на Voyage AI (Foundations §13). Нативный fetch
 * без новых зависимостей. Ключ передаётся в конструктор; фабрика модуля НЕ
 * выбирает этот провайдер без ключа, поэтому отсутствие ключа/ошибку сети просто
 * пробрасываем наверх. Возвращает вектор data[0].embedding.
 */
export class VoyageEmbeddingProvider extends EmbeddingProvider {
    readonly name = 'voyage';

    constructor(private readonly apiKey: string) {
        super();
    }

    async embed(text: string): Promise<number[]> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const response = await fetch(VOYAGE_URL, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    input: [text],
                    model: VOYAGE_MODEL,
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                const body = await response.text();
                throw new Error(`Voyage API error ${response.status}: ${body}`);
            }

            const data = (await response.json()) as VoyageResponse;
            const embedding = data.data?.[0]?.embedding;
            if (!embedding) {
                throw new Error('Voyage API: пустой ответ embeddings');
            }

            return embedding;
        } finally {
            clearTimeout(timer);
        }
    }
}
