import { COLLECTIONS, type SeedRecord } from '../types';

/**
 * Документы настроек платформы: 'default' (media/aiPrompts/seo) и 'social'
 * (соцссылки витрины — map платформа→url, редактируются в админке, читаются
 * публично футером). Пустые значения футер не показывает.
 */
export function buildPlatformSettings(): SeedRecord[] {
    return [
        {
            collection: COLLECTIONS.platformSettings,
            key: { key: 'social' },
            doc: {
                _id: 'platform_settings_social',
                key: 'social',
                scope: 'global',
                value: {
                    facebook: 'https://facebook.com/brickam',
                    instagram: 'https://instagram.com/brickam',
                    telegram: 'https://t.me/brickam',
                },
            },
        },
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
                            'Ты — ассистент маркетплейса стройматериалов Brickam. Помогай подобрать товары по запросу пользователя, учитывая категорию, цену и наличие.',
                        assistantSystem:
                            'Ты — консультант Brickam. Отвечай кратко и по делу на hy/ru/en, рекомендуй товары из каталога.',
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
