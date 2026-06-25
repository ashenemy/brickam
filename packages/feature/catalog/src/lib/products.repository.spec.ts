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
            updateOne: vi.fn(() => chain({ modifiedCount: 1 })),
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

    it('updateOwned фильтрует по _id+vendorId, $set/$unset, отдаёт modifiedCount', async () => {
        const modified = await repo.updateOwned('p1', 'v1', { price: 1200 }, { discount: '' });
        expect(model.updateOne).toHaveBeenCalledWith(
            { _id: 'p1', vendorId: 'v1' },
            { $set: { price: 1200 }, $unset: { discount: '' } },
        );
        expect(modified).toBe(1);
    });

    it('updateOwned без изменений → 0 без запроса', async () => {
        const modified = await repo.updateOwned('p1', 'v1', {});
        expect(model.updateOne).not.toHaveBeenCalled();
        expect(modified).toBe(0);
    });
});
