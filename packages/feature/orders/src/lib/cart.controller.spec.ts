import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartController } from './cart.controller';
import type { CartService } from './cart.service';

describe('CartController', () => {
    let service: {
        getCart: ReturnType<typeof vi.fn>;
        addItem: ReturnType<typeof vi.fn>;
        setQty: ReturnType<typeof vi.fn>;
        removeItem: ReturnType<typeof vi.fn>;
        clear: ReturnType<typeof vi.fn>;
    };
    let controller: CartController;

    beforeEach(() => {
        service = {
            getCart: vi.fn().mockResolvedValue({ buyerId: 'b1', items: [] }),
            addItem: vi.fn().mockResolvedValue({ buyerId: 'b1', items: [] }),
            setQty: vi.fn().mockResolvedValue({ buyerId: 'b1', items: [] }),
            removeItem: vi.fn().mockResolvedValue({ buyerId: 'b1', items: [] }),
            clear: vi.fn().mockResolvedValue({ buyerId: 'b1', items: [] }),
        };
        controller = new CartController(service as unknown as CartService);
    });

    it('getCart делегирует сервису', async () => {
        await controller.getCart('b1');
        expect(service.getCart).toHaveBeenCalledWith('b1');
    });

    it('addItem делегирует сервису', async () => {
        await controller.addItem('b1', { productId: 'p1', qty: 2 });
        expect(service.addItem).toHaveBeenCalledWith('b1', 'p1', 2);
    });

    it('setQty делегирует сервису', async () => {
        await controller.setQty('b1', 'p1', { qty: 3 });
        expect(service.setQty).toHaveBeenCalledWith('b1', 'p1', 3);
    });

    it('removeItem делегирует сервису', async () => {
        await controller.removeItem('b1', 'p1');
        expect(service.removeItem).toHaveBeenCalledWith('b1', 'p1');
    });

    it('clear делегирует сервису', async () => {
        await controller.clear('b1');
        expect(service.clear).toHaveBeenCalledWith('b1');
    });
});
