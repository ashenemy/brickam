import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DisputesRepository } from './disputes.repository';

const chain = (result: unknown) => {
    const query: any = {};
    query.sort = vi.fn(() => query);
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('DisputesRepository', () => {
    let model: any;
    let repo: DisputesRepository;

    beforeEach(() => {
        model = { find: vi.fn(() => chain([{ id: 'd1' }])) };
        repo = new DisputesRepository(model);
    });

    it('findByStatus фильтрует по статусу и сортирует по at', async () => {
        await repo.findByStatus('open');
        expect(model.find).toHaveBeenCalledWith({ status: 'open' });
    });

    it('findByVendor фильтрует по vendorId', async () => {
        await repo.findByVendor('v1');
        expect(model.find).toHaveBeenCalledWith({ vendorId: 'v1' });
    });
});
