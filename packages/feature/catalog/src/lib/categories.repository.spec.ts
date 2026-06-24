import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoriesRepository } from './categories.repository';

const chain = (result: unknown) => {
    const query: any = {};
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('CategoriesRepository', () => {
    let model: any;
    let repo: CategoriesRepository;

    beforeEach(() => {
        model = { findOne: vi.fn(() => chain({ _id: '1', slug: 'tools' })) };
        repo = new CategoriesRepository(model);
    });

    it('findBySlug ищет по полю slug', async () => {
        const doc = await repo.findBySlug('tools');
        expect(model.findOne).toHaveBeenCalledWith({ slug: 'tools' });
        expect(doc).toMatchObject({ slug: 'tools' });
    });
});
