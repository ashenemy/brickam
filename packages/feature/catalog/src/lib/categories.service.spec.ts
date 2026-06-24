import { NotFoundException } from '@brickam/core-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';

const makeDoc = (over: Record<string, unknown> = {}) => ({
    id: 'c1',
    _id: { toString: () => 'c1' },
    slug: 'tools',
    name: { hy: 'Գ', ru: 'Инструменты', en: 'Tools' },
    order: 2,
    parentId: 'root',
    icon: 'wrench',
    calculatorType: 'paint',
    ...over,
});

describe('CategoriesService', () => {
    let repo: {
        find: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        updateById: ReturnType<typeof vi.fn>;
    };
    let service: CategoriesService;

    beforeEach(() => {
        repo = { find: vi.fn(), create: vi.fn(), updateById: vi.fn() };
        service = new CategoriesService(repo as unknown as CategoriesRepository);
    });

    it('list возвращает контракты, отсортированные по order', async () => {
        repo.find.mockResolvedValue([makeDoc()]);
        const list = await service.list();
        expect(repo.find).toHaveBeenCalledWith({}, { sort: { order: 1 } });
        expect(list[0]).toEqual({
            id: 'c1',
            slug: 'tools',
            name: { hy: 'Գ', ru: 'Инструменты', en: 'Tools' },
            order: 2,
            parentId: 'root',
            icon: 'wrench',
            calculatorType: 'paint',
        });
    });

    it('list опускает отсутствующие опциональные поля', async () => {
        repo.find.mockResolvedValue([
            makeDoc({ parentId: undefined, icon: undefined, calculatorType: undefined }),
        ]);
        const list = await service.list();
        expect('parentId' in list[0]!).toBe(false);
        expect('icon' in list[0]!).toBe(false);
    });

    it('createCategory возвращает контракт', async () => {
        repo.create.mockResolvedValue(makeDoc());
        const cat = await service.createCategory({ slug: 'tools' } as never);
        expect(cat.id).toBe('c1');
    });

    it('updateCategory возвращает контракт', async () => {
        repo.updateById.mockResolvedValue(makeDoc({ order: 9 }));
        const cat = await service.updateCategory('c1', { order: 9 } as never);
        expect(cat.order).toBe(9);
    });

    it('updateCategory бросает NotFound, если категории нет', async () => {
        repo.updateById.mockResolvedValue(null);
        await expect(service.updateCategory('x', {} as never)).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });
});
