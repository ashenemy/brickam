import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductsRepository } from './products.repository';

const chain = (result: unknown) => {
    const query: any = {};
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('ProductsRepository', () => {
    let model: any;
    let repo: ProductsRepository;

    beforeEach(() => {
        model = {
            findOne: vi.fn(() => chain({ _id: '1', slug: 'cement' })),
            findByIdAndUpdate: vi.fn(() => chain({ _id: '1' })),
        };
        repo = new ProductsRepository(model);
    });

    it('findBySlug ищет по полю slug', async () => {
        const doc = await repo.findBySlug('cement');
        expect(model.findOne).toHaveBeenCalledWith({ slug: 'cement' });
        expect(doc).toMatchObject({ slug: 'cement' });
    });

    it('incrementViews инкрементит viewsCount', async () => {
        await repo.incrementViews('p1');
        expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
            'p1',
            { $inc: { viewsCount: 1 } },
            { new: true },
        );
    });
});
