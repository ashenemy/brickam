import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TemplatesRepository } from './templates.repository';

/** Цепочечный стаб Mongoose-Query. */
const chain = (result: unknown) => {
    const query: any = {};
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('TemplatesRepository', () => {
    let model: any;
    let repo: TemplatesRepository;

    beforeEach(() => {
        model = {
            findOne: vi.fn(() => chain({ _id: '1', key: 'auth.otp' })),
        };
        repo = new TemplatesRepository(model);
    });

    it('findByKey ищет документ по полю key', async () => {
        const doc = await repo.findByKey('auth.otp');
        expect(model.findOne).toHaveBeenCalledWith({ key: 'auth.otp' });
        expect(doc).toMatchObject({ key: 'auth.otp' });
    });
});
