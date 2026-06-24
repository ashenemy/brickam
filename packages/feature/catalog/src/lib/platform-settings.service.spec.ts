import type { Model } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlatformSettings } from './platform-settings.schema';
import { DEFAULT_MEDIA_SETTINGS, PlatformSettingsService } from './platform-settings.service';

const chain = (result: unknown) => ({ exec: vi.fn(() => Promise.resolve(result)) });

describe('PlatformSettingsService', () => {
    let model: { findOne: ReturnType<typeof vi.fn> };
    let service: PlatformSettingsService;

    beforeEach(() => {
        model = { findOne: vi.fn() };
        service = new PlatformSettingsService(model as unknown as Model<PlatformSettings>);
    });

    it('возвращает value из БД при наличии записи', async () => {
        const custom = { image: { allowedFormats: ['png'] } };
        model.findOne.mockReturnValue(chain({ value: custom }));
        const media = await service.getMedia();
        expect(media).toEqual(custom);
        expect(model.findOne).toHaveBeenCalledWith({ key: 'media' });
    });

    it('возвращает дефолты, если записи нет', async () => {
        model.findOne.mockReturnValue(chain(null));
        expect(await service.getMedia()).toEqual(DEFAULT_MEDIA_SETTINGS);
    });

    it('возвращает дефолты, если Mongo недоступен', async () => {
        model.findOne.mockImplementation(() => {
            throw new Error('no mongo');
        });
        expect(await service.getMedia()).toEqual(DEFAULT_MEDIA_SETTINGS);
    });
});
