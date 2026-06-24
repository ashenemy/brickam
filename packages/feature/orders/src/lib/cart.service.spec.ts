import { NotFoundException } from '@brickam/core-kit';
import type { CatalogServiceContract, ProductSnapshot } from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartService } from './cart.service';
import type { CartsRepository } from './carts.repository';

const makeSnapshot = (over: Partial<ProductSnapshot> = {}): ProductSnapshot => ({
    id: 'p1',
    vendorId: 'v1',
    title: { hy: 'ց', ru: 'товар', en: 'item' },
    unit: 'bag',
    price: 1000,
    stock: 10,
    ...over,
});

type CartDocMock = {
    buyerId: string;
    items: Array<Record<string, unknown>>;
    save: ReturnType<typeof vi.fn>;
};

const makeCartDoc = (over: Partial<CartDocMock> = {}): CartDocMock => ({
    buyerId: 'b1',
    items: [],
    save: vi.fn().mockResolvedValue(undefined),
    ...over,
});

describe('CartService', () => {
    let repo: {
        findByBuyer: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
    };
    let catalog: { getProductSnapshot: ReturnType<typeof vi.fn> };
    let service: CartService;

    beforeEach(() => {
        repo = { findByBuyer: vi.fn(), create: vi.fn() };
        catalog = { getProductSnapshot: vi.fn() };
        service = new CartService(
            repo as unknown as CartsRepository,
            catalog as unknown as CatalogServiceContract,
        );
    });

    describe('addItem', () => {
        it('берёт снимок у каталога и кладёт позицию со snapshot', async () => {
            const doc = makeCartDoc();
            repo.findByBuyer.mockResolvedValue(doc);
            catalog.getProductSnapshot.mockResolvedValue(
                makeSnapshot({ price: 1500, discount: { type: 'percent', value: 10 } }),
            );

            const result = await service.addItem('b1', 'p1', 2);

            expect(catalog.getProductSnapshot).toHaveBeenCalledWith('p1');
            expect(doc.items).toHaveLength(1);
            expect(doc.items[0]).toMatchObject({
                productId: 'p1',
                vendorId: 'v1',
                qty: 2,
                priceSnapshot: 1500,
                discountSnapshot: { type: 'percent', value: 10 },
            });
            expect(doc.save).toHaveBeenCalled();
            expect(result.items[0]?.priceSnapshot).toBe(1500);
        });

        it('складывает количество, если позиция уже есть', async () => {
            const doc = makeCartDoc({
                items: [{ productId: 'p1', vendorId: 'v1', qty: 1, priceSnapshot: 1000 }],
            });
            repo.findByBuyer.mockResolvedValue(doc);
            catalog.getProductSnapshot.mockResolvedValue(makeSnapshot());

            await service.addItem('b1', 'p1', 3);

            expect(doc.items).toHaveLength(1);
            expect(doc.items[0]?.['qty']).toBe(4);
        });

        it('создаёт корзину, если её ещё нет', async () => {
            const created = makeCartDoc();
            repo.findByBuyer.mockResolvedValue(null);
            repo.create.mockResolvedValue(created);
            catalog.getProductSnapshot.mockResolvedValue(makeSnapshot());

            await service.addItem('b1', 'p1', 1);

            expect(repo.create).toHaveBeenCalledWith({ buyerId: 'b1', items: [] });
            expect(created.items).toHaveLength(1);
        });

        it('бросает NotFound, если товара нет', async () => {
            catalog.getProductSnapshot.mockResolvedValue(null);

            await expect(service.addItem('b1', 'pX', 1)).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('setQty / removeItem / clear', () => {
        it('setQty меняет количество', async () => {
            const doc = makeCartDoc({
                items: [{ productId: 'p1', vendorId: 'v1', qty: 1, priceSnapshot: 1000 }],
            });
            repo.findByBuyer.mockResolvedValue(doc);

            await service.setQty('b1', 'p1', 5);

            expect(doc.items[0]?.['qty']).toBe(5);
            expect(doc.save).toHaveBeenCalled();
        });

        it('setQty бросает NotFound, если позиции нет', async () => {
            repo.findByBuyer.mockResolvedValue(makeCartDoc());
            await expect(service.setQty('b1', 'pX', 2)).rejects.toBeInstanceOf(NotFoundException);
        });

        it('removeItem убирает позицию', async () => {
            const doc = makeCartDoc({
                items: [
                    { productId: 'p1', vendorId: 'v1', qty: 1, priceSnapshot: 1000 },
                    { productId: 'p2', vendorId: 'v2', qty: 1, priceSnapshot: 500 },
                ],
            });
            repo.findByBuyer.mockResolvedValue(doc);

            const result = await service.removeItem('b1', 'p1');

            expect(doc.items).toHaveLength(1);
            expect(result.items[0]?.productId).toBe('p2');
        });

        it('clear очищает корзину', async () => {
            const doc = makeCartDoc({
                items: [{ productId: 'p1', vendorId: 'v1', qty: 1, priceSnapshot: 1000 }],
            });
            repo.findByBuyer.mockResolvedValue(doc);

            const result = await service.clear('b1');

            expect(result.items).toHaveLength(0);
        });
    });

    describe('getCart', () => {
        it('возвращает существующую корзину', async () => {
            repo.findByBuyer.mockResolvedValue(
                makeCartDoc({
                    items: [{ productId: 'p1', vendorId: 'v1', qty: 2, priceSnapshot: 1000 }],
                }),
            );

            const result = await service.getCart('b1');

            expect(result.buyerId).toBe('b1');
            expect(result.items).toHaveLength(1);
        });
    });
});
