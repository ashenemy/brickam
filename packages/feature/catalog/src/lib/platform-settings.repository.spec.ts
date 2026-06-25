import type { Model } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlatformSettingsRepository } from './platform-settings.repository';
import type { PlatformSettings } from './platform-settings.schema';

const chain = (result: unknown) => ({ exec: vi.fn(() => Promise.resolve(result)) });

describe('PlatformSettingsRepository', () => {
    let model: { findOne: ReturnType<typeof vi.fn> };
    let repo: PlatformSettingsRepository;

    beforeEach(() => {
        model = { findOne: vi.fn() };
        repo = new PlatformSettingsRepository(model as unknown as Model<PlatformSettings>);
    });

    it('findByKey ищет по полю key', async () => {
        model.findOne.mockReturnValue(chain({ key: 'default', value: {} }));
        const doc = await repo.findByKey('default');
        expect(model.findOne).toHaveBeenCalledWith({ key: 'default' });
        expect(doc).toMatchObject({ key: 'default' });
    });

    it('findByKey возвращает null, если нет записи', async () => {
        model.findOne.mockReturnValue(chain(null));
        expect(await repo.findByKey('missing')).toBeNull();
    });
});
