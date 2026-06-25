import { LlmProvider } from '@brickam/domain-kit';

/** Эндпойнт Messages API. */
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
/** Версия API (обязательный заголовок anthropic-version). */
const ANTHROPIC_VERSION = '2023-06-01';
/** Быстрая/дешёвая модель для извлечения тем (Foundations §13). */
const ANTHROPIC_MODEL = 'claude-haiku-4-5';
/** Потолок вывода — структурированный JSON с темами помещается с запасом. */
const MAX_TOKENS = 1024;
/** Таймаут запроса (AbortController). */
const TIMEOUT_MS = 15_000;

type AnthropicTextBlock = { type: string; text?: string };
type AnthropicResponse = { content?: AnthropicTextBlock[] };

/**
 * Реальный LLM-провайдер на Anthropic Messages API (Foundations §13). Нативный
 * fetch без новых зависимостей. Ключ передаётся в конструктор; фабрика модуля
 * НЕ выбирает этот провайдер без ключа, поэтому отсутствие ключа/ошибку сети
 * просто пробрасываем наверх. Возвращает СЫРОЙ текст ответа — парсинг/ретраи
 * делает потребитель.
 */
export class AnthropicLlmProvider extends LlmProvider {
    readonly name = 'anthropic';

    constructor(private readonly apiKey: string) {
        super();
    }

    async complete(prompt: string): Promise<string> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

        try {
            const response = await fetch(ANTHROPIC_URL, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': ANTHROPIC_VERSION,
                },
                body: JSON.stringify({
                    model: ANTHROPIC_MODEL,
                    max_tokens: MAX_TOKENS,
                    messages: [{ role: 'user', content: prompt }],
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                const body = await response.text();
                throw new Error(`Anthropic API error ${response.status}: ${body}`);
            }

            const data = (await response.json()) as AnthropicResponse;
            const text = (data.content ?? [])
                .filter((block) => block.type === 'text')
                .map((block) => block.text ?? '')
                .join('');

            return text;
        } finally {
            clearTimeout(timer);
        }
    }
}
