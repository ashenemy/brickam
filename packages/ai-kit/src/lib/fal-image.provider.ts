import { ImageProvider } from '@brickam/domain-kit';

/** Эндпойнт генерации изображений fal.ai (быстрая модель). */
const FAL_URL = 'https://fal.run/fal-ai/flux/schnell';
/** Таймаут запроса (AbortController). Генерация дольше текста. */
const TIMEOUT_MS = 20_000;

type FalImage = { url?: string };
type FalResponse = { images?: FalImage[] };

/**
 * Реальный провайдер изображений на fal.ai (Foundations §13). Нативный fetch без
 * новых зависимостей. Ключ передаётся в конструктор; фабрика модуля НЕ выбирает
 * этот провайдер без ключа, поэтому отсутствие ключа/ошибку сети просто
 * пробрасываем наверх. Возвращает url первого изображения из ответа.
 */
export class FalImageProvider extends ImageProvider {
    readonly name = 'fal';

    constructor(private readonly apiKey: string) {
        super();
    }

    async generate(prompt: string): Promise<{ url: string }> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const response = await fetch(FAL_URL, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    authorization: `Key ${this.apiKey}`,
                },
                body: JSON.stringify({ prompt }),
                signal: controller.signal,
            });

            if (!response.ok) {
                const body = await response.text();
                throw new Error(`fal.ai API error ${response.status}: ${body}`);
            }

            const data = (await response.json()) as FalResponse;
            const url = data.images?.[0]?.url;
            if (!url) {
                throw new Error('fal.ai API: пустой ответ images');
            }

            return { url };
        } finally {
            clearTimeout(timer);
        }
    }
}
