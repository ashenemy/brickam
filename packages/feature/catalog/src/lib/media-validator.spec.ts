import { ValidationException } from '@brickam/core-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MediaValidator } from './media-validator';
import type { PlatformSettingsService } from './platform-settings.service';
import { DEFAULT_MEDIA_SETTINGS } from './platform-settings.service';

describe('MediaValidator', () => {
    let validator: MediaValidator;

    beforeEach(() => {
        const settings = {
            getMedia: vi.fn().mockResolvedValue(DEFAULT_MEDIA_SETTINGS),
        } as unknown as PlatformSettingsService;
        validator = new MediaValidator(settings);
    });

    it('валидное изображение проходит', async () => {
        await expect(
            validator.validate({
                mediaType: 'image',
                format: 'png',
                sizeBytes: 1024,
                width: 800,
                height: 600,
            }),
        ).resolves.toBeUndefined();
    });

    it('невалидный формат → ValidationException', async () => {
        await expect(
            validator.validate({ mediaType: 'image', format: 'gif' }),
        ).rejects.toBeInstanceOf(ValidationException);
    });

    it('превышение размера → ValidationException', async () => {
        await expect(
            validator.validate({ mediaType: 'image', sizeBytes: 9 * 1024 * 1024 }),
        ).rejects.toBeInstanceOf(ValidationException);
    });

    it('превышение длительности видео → ValidationException', async () => {
        await expect(
            validator.validate({ mediaType: 'video', format: 'mp4', durationSec: 120 }),
        ).rejects.toBeInstanceOf(ValidationException);
    });

    it('превышение размеров (width) → ValidationException', async () => {
        await expect(
            validator.validate({ mediaType: 'image', width: 5000 }),
        ).rejects.toBeInstanceOf(ValidationException);
    });

    it('details содержит список нарушений', async () => {
        try {
            await validator.validate({ mediaType: 'image', format: 'gif', width: 5000 });
            expect.unreachable('должно бросить');
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationException);
            const details = (e as ValidationException).details as { violations: string[] };
            expect(details.violations.length).toBe(2);
        }
    });

    it('валидное видео проходит', async () => {
        await expect(
            validator.validate({
                mediaType: 'video',
                format: 'webm',
                durationSec: 30,
                sizeBytes: 10 * 1024 * 1024,
            }),
        ).resolves.toBeUndefined();
    });
});
