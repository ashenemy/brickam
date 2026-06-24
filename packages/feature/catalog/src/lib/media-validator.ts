import { ValidationException } from '@brickam/core-kit';
import { Injectable } from '@nestjs/common';
import type { MediaMeta, MediaTypeLimits } from '../@types';
import { PlatformSettingsService } from './platform-settings.service';

/**
 * Валидатор медиа-метаданных против лимитов платформы (formats/size/duration/
 * dimensions). Лимиты берёт из PlatformSettingsService (БД или дефолты).
 */
@Injectable()
export class MediaValidator {
    constructor(private readonly settings: PlatformSettingsService) {}

    /** Проверяет один медиа-объект; при нарушениях бросает ValidationException. */
    async validate(media: MediaMeta): Promise<void> {
        const settings = await this.settings.getMedia();
        const limits: MediaTypeLimits =
            media.mediaType === 'video' ? settings.video : settings.image;
        const violations: string[] = [];

        if (media.format !== undefined) {
            const format = media.format.toLowerCase();
            if (!limits.allowedFormats.includes(format)) {
                violations.push(
                    `format '${media.format}' not allowed (allowed: ${limits.allowedFormats.join(', ')})`,
                );
            }
        }

        if (media.sizeBytes !== undefined && media.sizeBytes > limits.maxSizeMb * 1024 * 1024) {
            violations.push(`size exceeds ${limits.maxSizeMb}MB`);
        }

        if (
            media.mediaType === 'video' &&
            media.durationSec !== undefined &&
            limits.maxDurationSec !== undefined &&
            media.durationSec > limits.maxDurationSec
        ) {
            violations.push(`duration exceeds ${limits.maxDurationSec}s`);
        }

        if (media.width !== undefined && media.width > limits.maxWidth) {
            violations.push(`width exceeds ${limits.maxWidth}px`);
        }

        if (media.height !== undefined && media.height > limits.maxHeight) {
            violations.push(`height exceeds ${limits.maxHeight}px`);
        }

        if (violations.length > 0) {
            throw new ValidationException('errors.media.invalid', { violations });
        }
    }
}
