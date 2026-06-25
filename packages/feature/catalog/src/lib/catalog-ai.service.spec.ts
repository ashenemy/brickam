import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CatalogAiService, DEFAULT_AI_PROMPTS } from './catalog-ai.service';
import type { PlatformSettingsRepository } from './platform-settings.repository';
import type { ProductsRepository } from './products.repository';

describe('CatalogAiService', () => {
    let productsRepository: {
        findById: ReturnType<typeof vi.fn>;
        updateOwned: ReturnType<typeof vi.fn>;
    };
    let settingsRepository: { findByKey: ReturnType<typeof vi.fn> };
    let service: CatalogAiService;

    beforeEach(() => {
        productsRepository = { findById: vi.fn(), updateOwned: vi.fn(() => Promise.resolve(1)) };
        settingsRepository = { findByKey: vi.fn() };
        service = new CatalogAiService(
            productsRepository as unknown as ProductsRepository,
            settingsRepository as unknown as PlatformSettingsRepository,
        );
    });

    describe('getAiPrompts', () => {
        it('есть запись → возвращает value.aiPrompts', async () => {
            const aiPrompts = { description: 'd', image: 'i', video: 'v' };
            settingsRepository.findByKey.mockResolvedValue({ value: { aiPrompts } });
            expect(await service.getAiPrompts()).toEqual(aiPrompts);
            expect(settingsRepository.findByKey).toHaveBeenCalledWith('default');
        });

        it('нет записи → дефолты', async () => {
            settingsRepository.findByKey.mockResolvedValue(null);
            expect(await service.getAiPrompts()).toEqual(DEFAULT_AI_PROMPTS);
        });

        it('частичная запись → фолбэк по недостающим полям', async () => {
            settingsRepository.findByKey.mockResolvedValue({
                value: { aiPrompts: { description: 'custom' } },
            });
            const result = await service.getAiPrompts();
            expect(result.description).toBe('custom');
            expect(result.image).toBe(DEFAULT_AI_PROMPTS.image);
            expect(result.video).toBe(DEFAULT_AI_PROMPTS.video);
        });

        it('ошибка Mongo → дефолты', async () => {
            settingsRepository.findByKey.mockRejectedValue(new Error('no mongo'));
            expect(await service.getAiPrompts()).toEqual(DEFAULT_AI_PROMPTS);
        });
    });

    describe('getProductContext', () => {
        it('свой товар → контекст с gallery как список url', async () => {
            productsRepository.findById.mockResolvedValue({
                vendorId: 'v1',
                categoryId: 'c1',
                title: { hy: 'h', ru: 'r', en: 'e' },
                description: { hy: 'dh', ru: 'dr', en: 'de' },
                gallery: [{ url: 'u1' }, { url: 'u2' }],
            });
            const ctx = await service.getProductContext('p1', 'v1');
            expect(ctx).toEqual({
                title: { hy: 'h', ru: 'r', en: 'e' },
                description: { hy: 'dh', ru: 'dr', en: 'de' },
                categoryId: 'c1',
                gallery: ['u1', 'u2'],
            });
        });

        it('чужой товар → null', async () => {
            productsRepository.findById.mockResolvedValue({ vendorId: 'other' });
            expect(await service.getProductContext('p1', 'v1')).toBeNull();
        });

        it('нет товара → null', async () => {
            productsRepository.findById.mockResolvedValue(null);
            expect(await service.getProductContext('p1', 'v1')).toBeNull();
        });
    });

    describe('setCover', () => {
        it('зовёт updateOwned с cover (с thumbnailUrl)', async () => {
            await service.setCover('p1', 'v1', {
                mediaType: 'video',
                url: 'vid.mp4',
                thumbnailUrl: 'thumb.png',
            });
            expect(productsRepository.updateOwned).toHaveBeenCalledWith('p1', 'v1', {
                cover: { mediaType: 'video', url: 'vid.mp4', thumbnailUrl: 'thumb.png' },
            });
        });

        it('без thumbnailUrl → cover без thumbnailUrl', async () => {
            await service.setCover('p1', 'v1', { mediaType: 'image', url: 'img.png' });
            expect(productsRepository.updateOwned).toHaveBeenCalledWith('p1', 'v1', {
                cover: { mediaType: 'image', url: 'img.png' },
            });
        });
    });
});
