import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvoicesRepository } from './invoices.repository';

const chain = (result: unknown) => {
    const query: any = {};
    query.sort = vi.fn(() => query);
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('InvoicesRepository', () => {
    let model: any;
    let repo: InvoicesRepository;

    beforeEach(() => {
        model = {
            findOne: vi.fn(() => chain({ invoiceNumber: 'INV-1' })),
            find: vi.fn(() => chain([{ chatId: 'c1' }])),
        };
        repo = new InvoicesRepository(model);
    });

    it('findByNumber ищет по invoiceNumber', async () => {
        const doc = await repo.findByNumber('INV-1');
        expect(model.findOne).toHaveBeenCalledWith({ invoiceNumber: 'INV-1' });
        expect(doc).toMatchObject({ invoiceNumber: 'INV-1' });
    });

    it('findByChat фильтрует по chatId с сортировкой по createdAt', async () => {
        const docs = await repo.findByChat('c1');
        expect(model.find).toHaveBeenCalledWith({ chatId: 'c1' });
        expect(docs).toHaveLength(1);
    });
});
