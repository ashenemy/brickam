import { describe, expect, it, vi } from 'vitest';
import { CartsRepository } from './carts.repository';
import { DeliveryAddressesRepository } from './delivery-addresses.repository';
import { OrdersRepository } from './orders.repository';
import { VendorOrdersRepository } from './vendor-orders.repository';

const chain = (result: unknown) => {
    const query: any = {};
    query.sort = vi.fn(() => query);
    query.skip = vi.fn(() => query);
    query.limit = vi.fn(() => query);
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('orders repositories', () => {
    it('CartsRepository.findByBuyer ищет по buyerId', async () => {
        const model: any = { findOne: vi.fn(() => chain({ buyerId: 'b1' })) };
        const repo = new CartsRepository(model);
        const doc = await repo.findByBuyer('b1');
        expect(model.findOne).toHaveBeenCalledWith({ buyerId: 'b1' });
        expect(doc).toMatchObject({ buyerId: 'b1' });
    });

    it('OrdersRepository.findByNumber ищет по orderNumber', async () => {
        const model: any = { findOne: vi.fn(() => chain({ orderNumber: 'BH-X' })) };
        const repo = new OrdersRepository(model);
        const doc = await repo.findByNumber('BH-X');
        expect(model.findOne).toHaveBeenCalledWith({ orderNumber: 'BH-X' });
        expect(doc).toMatchObject({ orderNumber: 'BH-X' });
    });

    it('OrdersRepository.findByBuyer возвращает страницу', async () => {
        const model: any = {
            find: vi.fn(() => chain([{ buyerId: 'b1' }])),
            countDocuments: vi.fn(() => chain(1)),
        };
        const repo = new OrdersRepository(model);
        const page = await repo.findByBuyer('b1', { page: 1, pageSize: 20 });
        expect(model.find).toHaveBeenCalledWith({ buyerId: 'b1' });
        expect(page.data).toHaveLength(1);
        expect(page.meta.total).toBe(1);
    });

    it('VendorOrdersRepository.findByOrder ищет по orderId', async () => {
        const model: any = { find: vi.fn(() => chain([{ orderId: 'o1' }])) };
        const repo = new VendorOrdersRepository(model);
        const docs = await repo.findByOrder('o1');
        expect(model.find).toHaveBeenCalledWith({ orderId: 'o1' });
        expect(docs).toHaveLength(1);
    });

    it('DeliveryAddressesRepository.findByUser ищет по userId', async () => {
        const model: any = { find: vi.fn(() => chain([{ userId: 'u1' }])) };
        const repo = new DeliveryAddressesRepository(model);
        const docs = await repo.findByUser('u1');
        expect(model.find).toHaveBeenCalledWith({ userId: 'u1' });
        expect(docs).toHaveLength(1);
    });
});
