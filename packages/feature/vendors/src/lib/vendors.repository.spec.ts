import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VendorsRepository } from './vendors.repository';

const chain = (result: unknown) => {
    const query: any = {};
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('VendorsRepository', () => {
    let model: any;
    let repo: VendorsRepository;

    beforeEach(() => {
        model = {
            findOne: vi.fn(() => chain({ slug: 'acme' })),
        };
        repo = new VendorsRepository(model);
    });

    it('findBySlug ищет по slug', async () => {
        const doc = await repo.findBySlug('acme');
        expect(model.findOne).toHaveBeenCalledWith({ slug: 'acme' });
        expect(doc).toMatchObject({ slug: 'acme' });
    });

    it('findByOwner ищет по ownerUserId', async () => {
        await repo.findByOwner('u1');
        expect(model.findOne).toHaveBeenCalledWith({ ownerUserId: 'u1' });
    });
});
