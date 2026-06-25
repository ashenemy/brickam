import {
    type AiPrompts,
    type MediaInput,
    PlatformSettingsContract,
    type ProductAiContext,
    ProductMediaContract,
} from '@brickam/domain-kit';
import { Injectable } from '@nestjs/common';
import { PlatformSettingsRepository } from './platform-settings.repository';
import { ProductsRepository } from './products.repository';

/** Ключ настройки с базовыми промпт-шаблонами в platform_settings. */
const AI_PROMPTS_KEY = 'default';

/**
 * Дефолтные промпт-шаблоны (Foundations §13) — fallback по полям, если в
 * platform_settings нет записи/поля. Строки-шаблоны для description/image/video.
 */
const DEFAULT_AI_PROMPTS: AiPrompts = {
    description: 'Напиши продающее описание строительного товара по названию и характеристикам.',
    image: 'Сгенерируй фотореалистичное изображение строительного товара по описанию.',
    video: 'Собери короткое слайдшоу-превью товара из набора фотографий.',
};

/**
 * Реализация контрактов настроек/медиа товара для AI-ассистента
 * (PlatformSettingsContract + ProductMediaContract, Foundations §13/§16).
 * Владелец данных — `catalog`; `ai-assistant` зависит только от контрактов.
 */
@Injectable()
export class CatalogAiService implements PlatformSettingsContract, ProductMediaContract {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly platformSettingsRepository: PlatformSettingsRepository,
    ) {}

    /**
     * Базовые промпт-шаблоны из platform_settings (key='default', value.aiPrompts).
     * Каждое поле падает на дефолт, если записи/поля нет; при ошибке Mongo — все
     * дефолты (fail-safe).
     */
    async getAiPrompts(): Promise<AiPrompts> {
        let stored: Partial<AiPrompts> = {};
        try {
            const doc = await this.platformSettingsRepository.findByKey(AI_PROMPTS_KEY);
            const value = doc?.value as { aiPrompts?: Partial<AiPrompts> } | undefined;
            if (value?.aiPrompts) {
                stored = value.aiPrompts;
            }
        } catch {
            // Mongo недоступен — отдаём дефолты (fail-safe).
        }
        return {
            description: stored.description ?? DEFAULT_AI_PROMPTS.description,
            image: stored.image ?? DEFAULT_AI_PROMPTS.image,
            video: stored.video ?? DEFAULT_AI_PROMPTS.video,
        };
    }

    /**
     * Переопределение комиссии платформы из platform_settings (key='default',
     * value.commissionPercent). Число → возвращается как есть; нет записи/поля или
     * не число → null (вызывающий падает на дефолт конфига).
     */
    async getCommissionPercent(): Promise<number | null> {
        const doc = await this.platformSettingsRepository.findByKey(AI_PROMPTS_KEY);
        const value = doc?.value as { commissionPercent?: unknown } | undefined;
        const commission = value?.commissionPercent;
        return typeof commission === 'number' ? commission : null;
    }

    /**
     * Произвольная настройка платформы по ключу → её value (Record) или null,
     * если записи нет (media-лимиты, бот-UA, и т.п.).
     */
    async getSetting(key: string): Promise<Record<string, unknown> | null> {
        const doc = await this.platformSettingsRepository.findByKey(key);
        return doc?.value ?? null;
    }

    /** Сохраняет/обновляет настройку по ключу (upsert, админ §17). */
    async saveSetting(key: string, value: Record<string, unknown>): Promise<void> {
        await this.platformSettingsRepository.upsertByKey(key, value);
    }

    /**
     * Контекст товара вендора для сборки промпта. Проверяет принадлежность по
     * vendorId — чужой/несуществующий товар → null. gallery маппится в список URL.
     */
    async getProductContext(productId: string, vendorId: string): Promise<ProductAiContext | null> {
        const doc = await this.productsRepository.findById(productId);
        if (!doc || doc.vendorId !== vendorId) {
            return null;
        }
        return {
            title: { hy: doc.title.hy, ru: doc.title.ru, en: doc.title.en },
            description: {
                hy: doc.description.hy,
                ru: doc.description.ru,
                en: doc.description.en,
            },
            categoryId: doc.categoryId,
            gallery: (doc.gallery ?? []).map((media) => media.url),
        };
    }

    /**
     * Прикрепляет результат AI как обложку товара — ТОЛЬКО для товара этого
     * вендора (updateOwned фильтрует по vendorId). thumbnailUrl добавляется лишь
     * если задан.
     */
    async setCover(productId: string, vendorId: string, cover: MediaInput): Promise<void> {
        await this.productsRepository.updateOwned(productId, vendorId, {
            cover: {
                mediaType: cover.mediaType,
                url: cover.url,
                ...(cover.thumbnailUrl !== undefined ? { thumbnailUrl: cover.thumbnailUrl } : {}),
            },
        });
    }
}

export { DEFAULT_AI_PROMPTS };
