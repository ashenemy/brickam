import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VendorMembersRepository } from './vendor-members.repository';

const chain = (result: unknown) => {
    const query: any = {};
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('VendorMembersRepository', () => {
    let model: any;
    let repo: VendorMembersRepository;

    beforeEach(() => {
        model = {
            find: vi.fn(() => chain([{ userId: 'u1' }])),
            findOne: vi.fn(() => chain({ userId: 'u1' })),
        };
        repo = new VendorMembersRepository(model);
    });

    it('findByVendor ищет по vendorId', async () => {
        await repo.findByVendor('v1');
        expect(model.find).toHaveBeenCalledWith({ vendorId: 'v1' });
    });

    it('findByVendorUser ищет по паре vendorId+userId', async () => {
        const doc = await repo.findByVendorUser('v1', 'u1');
        expect(model.findOne).toHaveBeenCalledWith({ vendorId: 'v1', userId: 'u1' });
        expect(doc).toMatchObject({ userId: 'u1' });
    });
});
