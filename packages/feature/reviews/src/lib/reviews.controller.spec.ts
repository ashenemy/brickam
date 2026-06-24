import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewsController } from './reviews.controller';
import type { ReviewsService } from './reviews.service';

describe('ReviewsController', () => {
    let service: {
        create: ReturnType<typeof vi.fn>;
        setStatus: ReturnType<typeof vi.fn>;
        listByVendor: ReturnType<typeof vi.fn>;
        listByProduct: ReturnType<typeof vi.fn>;
    };
    let controller: ReviewsController;

    beforeEach(() => {
        service = {
            create: vi.fn().mockResolvedValue({ id: 'r1' }),
            setStatus: vi.fn().mockResolvedValue({ id: 'r1', status: 'hidden' }),
            listByVendor: vi.fn().mockResolvedValue({ reviews: [], ratingAvg: 0, ratingCount: 0 }),
            listByProduct: vi.fn().mockResolvedValue({ reviews: [], ratingAvg: 0, ratingCount: 0 }),
        };
        controller = new ReviewsController(service as unknown as ReviewsService);
    });

    it('create передаёт buyerId и dto', async () => {
        const dto = { vendorOrderId: 'vo1', rating: 5, text: 't', productId: 'p1' };
        await controller.create('b1', dto);
        expect(service.create).toHaveBeenCalledWith('b1', dto);
    });

    it('setStatus передаёт id и status из dto', async () => {
        await controller.setStatus('r1', { status: 'hidden' });
        expect(service.setStatus).toHaveBeenCalledWith('r1', 'hidden');
    });

    it('listByVendor делегирует сервису', async () => {
        await controller.listByVendor('v1');
        expect(service.listByVendor).toHaveBeenCalledWith('v1');
    });

    it('listByProduct делегирует сервису', async () => {
        await controller.listByProduct('p1');
        expect(service.listByProduct).toHaveBeenCalledWith('p1');
    });
});
