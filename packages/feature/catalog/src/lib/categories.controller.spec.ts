import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoriesController } from './categories.controller';
import type { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
    let service: {
        list: ReturnType<typeof vi.fn>;
        createCategory: ReturnType<typeof vi.fn>;
        updateCategory: ReturnType<typeof vi.fn>;
        remove: ReturnType<typeof vi.fn>;
    };
    let controller: CategoriesController;

    beforeEach(() => {
        service = {
            list: vi.fn().mockResolvedValue([{ id: 'c1' }]),
            createCategory: vi.fn().mockResolvedValue({ id: 'c1' }),
            updateCategory: vi.fn().mockResolvedValue({ id: 'c1' }),
            remove: vi.fn().mockResolvedValue(undefined),
        };
        controller = new CategoriesController(service as unknown as CategoriesService);
    });

    it('list делегирует сервису', async () => {
        await controller.list();
        expect(service.list).toHaveBeenCalled();
    });

    it('create делегирует сервису', async () => {
        await controller.create({ slug: 'tools' } as never);
        expect(service.createCategory).toHaveBeenCalled();
    });

    it('update делегирует сервису', async () => {
        await controller.update('c1', { order: 1 } as never);
        expect(service.updateCategory).toHaveBeenCalledWith('c1', { order: 1 });
    });

    it('remove возвращает id', async () => {
        expect(await controller.remove('c1')).toEqual({ id: 'c1' });
        expect(service.remove).toHaveBeenCalledWith('c1');
    });
});
