import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReviewsRepository } from './reviews.repository';

const chain = (result: unknown) => {
    const query: any = {};
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('ReviewsRepository', () => {
    let model: any;
    let repo: ReviewsRepository;

    beforeEach(() => {
        model = {
            findOne: vi.fn(() => chain({ vendorOrderId: 'vo1' })),
            find: vi.fn(() => chain([{ rating: 5 }])),
        };
        repo = new ReviewsRepository(model);
    });

    it('findByVendorOrder ищет по vendorOrderId', async () => {
        const doc = await repo.findByVendorOrder('vo1');
        expect(model.findOne).toHaveBeenCalledWith({ vendorOrderId: 'vo1' });
        expect(doc).toMatchObject({ vendorOrderId: 'vo1' });
    });

    it('findPublishedByVendor фильтрует по vendorId и status=published', async () => {
        await repo.findPublishedByVendor('v1');
        expect(model.find).toHaveBeenCalledWith({ vendorId: 'v1', status: 'published' });
    });

    it('findPublishedByProduct фильтрует по productId и status=published', async () => {
        await repo.findPublishedByProduct('p1');
        expect(model.find).toHaveBeenCalledWith({ productId: 'p1', status: 'published' });
    });
});
