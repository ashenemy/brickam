import { LlmProvider } from '@brickam/domain-kit';

/** Стоп-слова — отбрасываем при эвристическом извлечении ключевых слов. */
const STOP_WORDS = new Set<string>([
    'и',
    'в',
    'на',
    'с',
    'по',
    'для',
    'из',
    'от',
    'до',
    'за',
    'к',
    'у',
    'о',
    'а',
    'но',
    'или',
    'это',
    'как',
    'что',
    'чтобы',
    'под',
    'над',
    'при',
    'же',
    'бы',
    'ли',
    'не',
    'мне',
    'нужно',
    'хочу',
    'надо',
    'мой',
    'моя',
    'моё',
    'the',
    'a',
    'an',
    'of',
    'for',
    'and',
    'or',
    'to',
    'in',
    'on',
    'with',
    'i',
    'my',
    'me',
    'need',
    'want',
]);

/**
 * Детерминированный mock LLM (Foundations §13). Используется, когда внешний
 * провайдер недоступен/без ключа и в тестах. complete() ВСЕГДА возвращает
 * валидный строгий JSON формы {projectType, themes:[{name, materialCategories,
 * keywords}]}; темы извлекаются эвристически из текста запроса (после маркера
 * `User query:` если он есть). Без сети.
 */
export class MockLlmProvider extends LlmProvider {
    readonly name = 'mock';

    async complete(prompt: string): Promise<string> {
        const query = this.extractQuery(prompt);
        const words = this.significantWords(query);

        const projectType = words.length > 0 ? words.slice(0, 2).join(' ') : 'строительный проект';
        const keywords = words.length > 0 ? words.slice(0, 5) : ['материалы'];

        const result = {
            projectType,
            themes: [
                {
                    name: 'Отделка',
                    materialCategories: ['finishing'],
                    keywords,
                },
            ],
        };

        return JSON.stringify(result);
    }

    /** Берём пользовательский текст после маркера `User query:` либо весь prompt. */
    private extractQuery(prompt: string): string {
        const marker = /user query:\s*/i;
        const match = marker.exec(prompt);
        if (match) {
            return prompt.slice(match.index + match[0].length).trim();
        }
        return prompt.trim();
    }

    /** Значимые слова (без пунктуации/стоп-слов, длиннее 2 символов). */
    private significantWords(text: string): string[] {
        const tokens = text
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .split(/\s+/)
            .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

        // Уникализируем, сохраняя порядок.
        return [...new Set(tokens)];
    }
}
