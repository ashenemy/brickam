import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatsRepository } from './chats.repository';
import { MessagesRepository } from './messages.repository';

const chain = (result: unknown) => {
    const query: any = {};
    query.sort = vi.fn(() => query);
    query.skip = vi.fn(() => query);
    query.limit = vi.fn(() => query);
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('ChatsRepository', () => {
    let model: any;
    let repo: ChatsRepository;

    beforeEach(() => {
        model = {
            findOne: vi.fn(() => chain({ buyerId: 'b1', vendorId: 'v1' })),
            find: vi.fn(() => chain([{ id: 'c1' }])),
        };
        repo = new ChatsRepository(model);
    });

    it('findBetween ищет по паре buyerId/vendorId', async () => {
        const doc = await repo.findBetween('b1', 'v1');
        expect(model.findOne).toHaveBeenCalledWith({ buyerId: 'b1', vendorId: 'v1' });
        expect(doc).toMatchObject({ buyerId: 'b1' });
    });

    it('listForUser фильтрует по buyerId с сортировкой', async () => {
        await repo.listForUser('b1');
        expect(model.find).toHaveBeenCalledWith({ buyerId: 'b1' });
    });

    it('listForVendor фильтрует по vendorId', async () => {
        await repo.listForVendor('v1');
        expect(model.find).toHaveBeenCalledWith({ vendorId: 'v1' });
    });
});

describe('MessagesRepository', () => {
    let model: any;
    let repo: MessagesRepository;

    beforeEach(() => {
        model = {
            find: vi.fn(() => chain([{ id: 'm1' }])),
            countDocuments: vi.fn(() => chain(1)),
            updateMany: vi.fn(() => chain({ modifiedCount: 2 })),
        };
        repo = new MessagesRepository(model);
    });

    it('findByChat пагинирует по chatId', async () => {
        const page = await repo.findByChat('c1', { page: 1, pageSize: 20 });
        expect(model.find).toHaveBeenCalledWith({ chatId: 'c1' });
        expect(model.countDocuments).toHaveBeenCalledWith({ chatId: 'c1' });
        expect(page.data).toHaveLength(1);
    });

    it('markReadByUser обновляет непрочитанные и возвращает количество', async () => {
        const n = await repo.markReadByUser('c1', 'u1');
        expect(model.updateMany).toHaveBeenCalledWith(
            { chatId: 'c1', readBy: { $ne: 'u1' } },
            { $addToSet: { readBy: 'u1' } },
        );
        expect(n).toBe(2);
    });

    it('listByChat возвращает сообщения чата', async () => {
        const docs = await repo.listByChat('c1');
        expect(model.find).toHaveBeenCalledWith({ chatId: 'c1' });
        expect(docs).toHaveLength(1);
    });
});
