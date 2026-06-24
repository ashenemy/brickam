import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WishlistController } from './wishlist.controller';
import type { WishlistService } from './wishlist.service';

describe('WishlistController', () => {
    let service: {
        list: ReturnType<typeof vi.fn>;
        add: ReturnType<typeof vi.fn>;
        remove: ReturnType<typeof vi.fn>;
    };
    let controller: WishlistController;

    beforeEach(() => {
        service = {
            list: vi.fn().mockResolvedValue({ items: [], count: 0 }),
            add: vi.fn().mockResolvedValue({ items: [], count: 1 }),
            remove: vi.fn().mockResolvedValue({ items: [], count: 0 }),
        };
        controller = new WishlistController(service as unknown as WishlistService);
    });

    it('list делегирует сервису с userId', async () => {
        await controller.list('u1');
        expect(service.list).toHaveBeenCalledWith('u1');
    });

    it('add передаёт userId и productId из dto', async () => {
        await controller.add('u1', { productId: 'p1' });
        expect(service.add).toHaveBeenCalledWith('u1', 'p1');
    });

    it('remove передаёт userId и productId из параметра', async () => {
        await controller.remove('u1', 'p1');
        expect(service.remove).toHaveBeenCalledWith('u1', 'p1');
    });
});
