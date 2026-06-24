import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentsRepository } from './payments.repository';

const chain = (result: unknown) => {
    const query: any = {};
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('PaymentsRepository', () => {
    let model: any;
    let repo: PaymentsRepository;

    beforeEach(() => {
        model = { findOne: vi.fn(() => chain({ _id: '1', orderId: 'o1' })) };
        repo = new PaymentsRepository(model);
    });

    it('findByOrder ищет по полю orderId', async () => {
        const doc = await repo.findByOrder('o1');
        expect(model.findOne).toHaveBeenCalledWith({ orderId: 'o1' });
        expect(doc).toMatchObject({ orderId: 'o1' });
    });
});
