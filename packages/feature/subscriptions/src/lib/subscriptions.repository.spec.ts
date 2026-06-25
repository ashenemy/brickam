import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionsRepository } from './subscriptions.repository';

const chain = (result: unknown) => {
    const query: any = {};
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('SubscriptionsRepository', () => {
    let model: any;
    let repo: SubscriptionsRepository;

    beforeEach(() => {
        model = {
            findOne: vi.fn(() => chain({ vendorId: 'v1', plan: 'free' })),
        };
        repo = new SubscriptionsRepository(model);
    });

    it('findByVendor ищет по vendorId', async () => {
        const doc = await repo.findByVendor('v1');
        expect(model.findOne).toHaveBeenCalledWith({ vendorId: 'v1' });
        expect(doc).toMatchObject({ vendorId: 'v1' });
    });
});
