import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductsController } from './products.controller';
import type { ProductsService } from './products.service';

describe('ProductsController', () => {
    let service: {
        search: ReturnType<typeof vi.fn>;
        getBySlug: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
        remove: ReturnType<typeof vi.fn>;
    };
    let controller: ProductsController;

    beforeEach(() => {
        service = {
            search: vi.fn().mockResolvedValue({ data: [], meta: {} }),
            getBySlug: vi.fn().mockResolvedValue({ id: 'p1' }),
            create: vi.fn().mockResolvedValue({ id: 'p1' }),
            update: vi.fn().mockResolvedValue({ id: 'p1' }),
            remove: vi.fn().mockResolvedValue(undefined),
        };
        controller = new ProductsController(service as unknown as ProductsService);
    });

    it('search делегирует сервису', async () => {
        await controller.search({ page: 1, pageSize: 20 } as never);
        expect(service.search).toHaveBeenCalled();
    });

    it('getBySlug делегирует сервису', async () => {
        await controller.getBySlug('cement');
        expect(service.getBySlug).toHaveBeenCalledWith('cement');
    });

    it('create делегирует сервису', async () => {
        await controller.create({ slug: 'cement' } as never);
        expect(service.create).toHaveBeenCalled();
    });

    it('update делегирует сервису', async () => {
        await controller.update('p1', { price: 10 } as never);
        expect(service.update).toHaveBeenCalledWith('p1', { price: 10 });
    });

    it('remove возвращает id', async () => {
        expect(await controller.remove('p1')).toEqual({ id: 'p1' });
        expect(service.remove).toHaveBeenCalledWith('p1');
    });
});
