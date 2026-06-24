import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { MediaSettings } from '../@types';
import { PlatformSettings } from './platform-settings.schema';

/** Ключ настройки медиа-лимитов в platform_settings. */
const MEDIA_KEY = 'media';

/** Дефолтные медиа-лимиты (Foundations §13) — fallback, если БД недоступна. */
const DEFAULT_MEDIA_SETTINGS: MediaSettings = {
    image: {
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        maxSizeMb: 8,
        maxWidth: 4000,
        maxHeight: 4000,
    },
    video: {
        allowedFormats: ['mp4', 'webm'],
        maxSizeMb: 50,
        maxDurationSec: 60,
        maxWidth: 1920,
        maxHeight: 1920,
    },
};

/**
 * Сервис настроек платформы. Читает медиа-лимиты из коллекции platform_settings;
 * при отсутствии записи или недоступности Mongo возвращает безопасные дефолты.
 */
@Injectable()
export class PlatformSettingsService {
    constructor(
        @InjectModel(PlatformSettings.name)
        private readonly model: Model<PlatformSettings>,
    ) {}

    /** Возвращает медиа-лимиты из БД (key='media') или дефолты. */
    async getMedia(): Promise<MediaSettings> {
        try {
            const doc = await this.model.findOne({ key: MEDIA_KEY }).exec();
            if (doc?.value) {
                return doc.value as unknown as MediaSettings;
            }
        } catch {
            // Mongo недоступен — отдаём дефолты (fail-safe).
        }
        return DEFAULT_MEDIA_SETTINGS;
    }
}

export { DEFAULT_MEDIA_SETTINGS };
