import { DeliveryStatus } from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OrdersQueryDto } from './dto/orders-query.dto';
import { OrdersController } from './orders.controller';
import type { OrdersService } from './orders.service';

describe('OrdersController', () => {
    let service: {
        checkout: ReturnType<typeof vi.fn>;
        pay: ReturnType<typeof vi.fn>;
        listOrders: ReturnType<typeof vi.fn>;
        getOrder: ReturnType<typeof vi.fn>;
        updateDelivery: ReturnType<typeof vi.fn>;
    };
    let controller: OrdersController;

    beforeEach(() => {
        service = {
            checkout: vi.fn().mockResolvedValue({ order: { id: 'o1' } }),
            pay: vi.fn().mockResolvedValue({ id: 'o1' }),
            listOrders: vi.fn().mockResolvedValue({ data: [], meta: {} }),
            getOrder: vi.fn().mockResolvedValue({ id: 'o1' }),
            updateDelivery: vi.fn().mockResolvedValue({ id: 'vo1' }),
        };
        controller = new OrdersController(service as unknown as OrdersService);
    });

    it('checkout делегирует сервису', async () => {
        const dto = { deliveryAddress: {} } as never;
        await controller.checkout('b1', dto);
        expect(service.checkout).toHaveBeenCalledWith('b1', dto);
    });

    it('pay делегирует сервису', async () => {
        await controller.pay('b1', 'o1');
        expect(service.pay).toHaveBeenCalledWith('o1', 'b1');
    });

    it('list делегирует сервису', async () => {
        const query = { page: 1, pageSize: 20 } as OrdersQueryDto;
        await controller.list('b1', query);
        expect(service.listOrders).toHaveBeenCalledWith('b1', query);
    });

    it('getOrder делегирует сервису', async () => {
        await controller.getOrder('b1', 'o1');
        expect(service.getOrder).toHaveBeenCalledWith('o1', 'b1');
    });

    it('updateDelivery делегирует сервису', async () => {
        await controller.updateDelivery('vo1', {
            status: DeliveryStatus.InTransit,
            note: 'go',
        });
        expect(service.updateDelivery).toHaveBeenCalledWith('vo1', DeliveryStatus.InTransit, 'go');
    });
});
