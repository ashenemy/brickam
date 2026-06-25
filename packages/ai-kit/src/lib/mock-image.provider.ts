import { ImageProvider } from '@brickam/domain-kit';

/** База mock-URL изображений (не сетевой адрес, только заглушка). */
const MOCK_IMAGE_BASE = 'https://mock.local/img';

/**
 * Детерминированный mock провайдера изображений (Foundations §13). Используется,
 * когда внешний провайдер (fal) недоступен/без ключа и в тестах. generate()
 * возвращает стабильный URL-заглушку, зависящий только от промпта: одинаковый
 * промпт → одинаковый URL. Без сети.
 */
export class MockImageProvider extends ImageProvider {
    readonly name = 'mock';

    async generate(prompt: string): Promise<{ url: string }> {
        return { url: `${MOCK_IMAGE_BASE}/${hashString(prompt)}.png` };
    }
}

/** FNV-1a хеш строки в hex (детерминированный, без коллизий для тестов). */
export function hashString(value: string): string {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
        hash = Math.imul(hash ^ value.charCodeAt(i), 16777619) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
}
