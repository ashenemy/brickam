import { COLLECTIONS, type SeedRecord } from '../types';

/**
 * Единый документ настроек платформы (ключ 'default'): media (лимиты/форматы),
 * aiPrompts (системные подсказки §13), seo.botUserAgents (§19). Ровно один.
 */
export function buildPlatformSettings(): SeedRecord[] {
    return [
        {
            collection: COLLECTIONS.platformSettings,
            key: { key: 'default' },
            doc: {
                _id: 'platform_settings_default',
                key: 'default',
                scope: 'global',
                value: {
                    media: {
                        maxImageSizeMb: 8,
                        maxVideoSizeMb: 100,
                        allowedImageFormats: ['jpg', 'jpeg', 'png', 'webp'],
                        allowedVideoFormats: ['mp4', 'webm'],
                        maxGalleryItems: 12,
                    },
                    aiPrompts: {
                        searchSystem:
                            'Ты — ассистент маркетплейса стройматериалов BuildHub. Помогай подобрать товары по запросу пользователя, учитывая категорию, цену и наличие.',
                        assistantSystem:
                            'Ты — консультант BuildHub. Отвечай кратко и по делу на hy/ru/en, рекомендуй товары из каталога.',
                        descriptionSystem:
                            'Сгенерируй краткое продающее описание товара на hy/ru/en по его характеристикам.',
                    },
                    seo: {
                        botUserAgents: [
                            'googlebot',
                            'bingbot',
                            'yandex',
                            'duckduckbot',
                            'baiduspider',
                            'slurp',
                            'facebookexternalhit',
                            'twitterbot',
                        ],
                    },
                },
            },
        },
    ];
}
