import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WishlistRepository } from './wishlist.repository';
import type { WishlistDocument } from './wishlist.schema';
import { WishlistService } from './wishlist.service';

/** Документ-подобный объект вишлиста для маппинга. */
const makeDoc = (over: Record<string, unknown> = {}) =>
    ({
        id: 'w1',
        _id: { toString: () => 'w1' },
        userId: 'u1',
        items: [],
        ...over,
    }) as unknown as WishlistDocument;

describe('WishlistService', () => {
    let repo: {
        findByUser: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        updateById: ReturnType<typeof vi.fn>;
    };
    let service: WishlistService;

    beforeEach(() => {
        repo = {
            findByUser: vi.fn(),
            create: vi.fn(),
            updateById: vi.fn(),
        };
        service = new WishlistService(repo as unknown as WishlistRepository);
    });

    describe('list', () => {
        it('пустой вишлист, если документа нет', async () => {
            repo.findByUser.mockResolvedValue(null);
            const view = await service.list('u1');
            expect(view).toEqual({ items: [], count: 0 });
            expect(repo.findByUser).toHaveBeenCalledWith('u1');
        });

        it('непустой вишлист с корректным count', async () => {
            const addedAt = new Date('2026-01-01T00:00:00Z');
            repo.findByUser.mockResolvedValue(
                makeDoc({
                    items: [
                        { productId: 'p1', addedAt },
                        { productId: 'p2', addedAt },
                    ],
                }),
            );
            const view = await service.list('u1');
            expect(view.count).toBe(2);
            expect(view.items).toEqual([
                { productId: 'p1', addedAt },
                { productId: 'p2', addedAt },
            ]);
        });
    });

    describe('add', () => {
        it('создаёт документ, если его нет', async () => {
            repo.findByUser.mockResolvedValue(null);
            repo.create.mockImplementation((data) => makeDoc({ items: data.items }));
            const view = await service.add('u1', 'p1');
            expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'u1' }));
            expect(view.count).toBe(1);
            expect(view.items[0]?.productId).toBe('p1');
        });

        it('добавляет новый товар в существующий документ', async () => {
            repo.findByUser.mockResolvedValue(
                makeDoc({ items: [{ productId: 'p1', addedAt: new Date() }] }),
            );
            repo.updateById.mockResolvedValue(
                makeDoc({
                    items: [
                        { productId: 'p1', addedAt: new Date() },
                        { productId: 'p2', addedAt: new Date() },
                    ],
                }),
            );
            const view = await service.add('u1', 'p2');
            expect(repo.updateById).toHaveBeenCalled();
            expect(view.count).toBe(2);
        });

        it('идемпотентность: повторный add того же товара не дублирует и не растит count', async () => {
            const addedAt = new Date();
            repo.findByUser.mockResolvedValue(makeDoc({ items: [{ productId: 'p1', addedAt }] }));
            const view = await service.add('u1', 'p1');
            expect(repo.updateById).not.toHaveBeenCalled();
            expect(repo.create).not.toHaveBeenCalled();
            expect(view.count).toBe(1);
            expect(view.items).toEqual([{ productId: 'p1', addedAt }]);
        });
    });

    describe('remove', () => {
        it('убирает товар через $pull', async () => {
            repo.findByUser.mockResolvedValue(
                makeDoc({ items: [{ productId: 'p1', addedAt: new Date() }] }),
            );
            repo.updateById.mockResolvedValue(makeDoc({ items: [] }));
            const view = await service.remove('u1', 'p1');
            expect(repo.updateById).toHaveBeenCalled();
            expect(view.count).toBe(0);
        });

        it('идемпотентность: remove при отсутствии документа не падает', async () => {
            repo.findByUser.mockResolvedValue(null);
            const view = await service.remove('u1', 'p1');
            expect(repo.updateById).not.toHaveBeenCalled();
            expect(view).toEqual({ items: [], count: 0 });
        });

        it('идемпотентность: повторный remove отсутствующего товара не падает', async () => {
            repo.findByUser.mockResolvedValue(makeDoc({ items: [] }));
            repo.updateById.mockResolvedValue(makeDoc({ items: [] }));
            const view = await service.remove('u1', 'missing');
            expect(view.count).toBe(0);
        });
    });
});
