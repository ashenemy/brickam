import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersRepository } from './users.repository';

/** Цепочечный стаб Mongoose-Query. */
const chain = (result: unknown) => {
    const query: any = {};
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('UsersRepository', () => {
    let model: any;
    let repo: UsersRepository;

    beforeEach(() => {
        model = {
            findOne: vi.fn(() => chain({ _id: '1', phone: '+37499000000' })),
        };
        repo = new UsersRepository(model);
    });

    it('findByPhone ищет документ по полю phone', async () => {
        const doc = await repo.findByPhone('+37499000000');
        expect(model.findOne).toHaveBeenCalledWith({ phone: '+37499000000' });
        expect(doc).toMatchObject({ phone: '+37499000000' });
    });
});
