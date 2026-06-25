import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PagesController } from './pages.controller';
import type { PagesService } from './pages.service';

describe('PagesController', () => {
    let service: {
        listPublished: ReturnType<typeof vi.fn>;
        getPublished: ReturnType<typeof vi.fn>;
    };
    let controller: PagesController;

    beforeEach(() => {
        service = {
            listPublished: vi.fn().mockResolvedValue([{ slug: 'about' }]),
            getPublished: vi.fn().mockResolvedValue({ slug: 'about' }),
        };
        controller = new PagesController(service as unknown as PagesService);
    });

    it('listPublished делегирует сервису', async () => {
        const result = await controller.listPublished();
        expect(service.listPublished).toHaveBeenCalled();
        expect(result).toHaveLength(1);
    });

    it('getPublished передаёт slug', async () => {
        await controller.getPublished('about');
        expect(service.getPublished).toHaveBeenCalledWith('about');
    });
});
