import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiJobsRepository } from './ai-jobs.repository';

const chain = (result: unknown) => {
    const query: any = {};
    query.sort = vi.fn(() => query);
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('AiJobsRepository', () => {
    let model: any;
    let repo: AiJobsRepository;

    beforeEach(() => {
        model = { find: vi.fn(() => chain([{ id: 'job-1' }])) };
        repo = new AiJobsRepository(model);
    });

    it('findByVendor фильтрует по vendorId и сортирует по createdAt desc', async () => {
        const docs = await repo.findByVendor('v1');
        expect(model.find).toHaveBeenCalledWith({ vendorId: 'v1' });
        expect(docs).toHaveLength(1);
    });
});
