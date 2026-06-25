import type { AiPrompts, MediaInput, ProductAiContext } from '../@types';

/**
 * Контракт настроек платформы (Foundations §13/§15). Реализует `catalog`
 * (владелец platform_settings); `ai-assistant` читает базовые промпт-шаблоны.
 */
export abstract class PlatformSettingsContract {
    /** Базовые промпт-шаблоны (description/image/video) из platform_settings. */
    abstract getAiPrompts(): Promise<AiPrompts>;
}

/**
 * Контракт медиа/контекста товара для AI-ассистента (Foundations §13).
 * Реализует `catalog`; `ai-assistant` зависит только от контракта.
 */
export abstract class ProductMediaContract {
    /** Контекст товара вендора для сборки промпта (null если чужой/нет). */
    abstract getProductContext(
        productId: string,
        vendorId: string,
    ): Promise<ProductAiContext | null>;
    /** Прикрепляет результат как обложку товара вендора (видео-обложка и т.п.). */
    abstract setCover(productId: string, vendorId: string, cover: MediaInput): Promise<void>;
}
