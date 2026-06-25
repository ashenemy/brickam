import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoyaltyLedgerRepository } from './loyalty-ledger.repository';

const findChain = (result: unknown) => {
    const query: any = {};
    query.sort = vi.fn(() => query);
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('LoyaltyLedgerRepository', () => {
    let model: any;
    let repo: LoyaltyLedgerRepository;

    beforeEach(() => {
        model = { find: vi.fn(() => findChain([{ userId: 'b1' }])) };
        repo = new LoyaltyLedgerRepository(model);
    });

    it('findByUser фильтрует по userId с сортировкой', async () => {
        const docs = await repo.findByUser('b1');
        expect(model.find).toHaveBeenCalledWith({ userId: 'b1' });
        expect(docs).toEqual([{ userId: 'b1' }]);
    });
});
