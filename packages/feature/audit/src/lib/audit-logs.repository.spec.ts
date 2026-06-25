import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLogsRepository } from './audit-logs.repository';

const findChain = (result: unknown) => {
    const query: any = {};
    query.sort = vi.fn(() => query);
    query.limit = vi.fn(() => query);
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('AuditLogsRepository', () => {
    let model: any;
    let repo: AuditLogsRepository;

    beforeEach(() => {
        model = { find: vi.fn(() => findChain([{ id: 'a1' }])) };
        repo = new AuditLogsRepository(model);
    });

    it('findRecent сортирует по at убыванию и ограничивает limit', async () => {
        const query = findChain([{ id: 'a1' }]);
        model.find.mockReturnValue(query);
        const result = await repo.findRecent(5);
        expect(query.sort).toHaveBeenCalledWith({ at: -1 });
        expect(query.limit).toHaveBeenCalledWith(5);
        expect(result).toEqual([{ id: 'a1' }]);
    });
});
