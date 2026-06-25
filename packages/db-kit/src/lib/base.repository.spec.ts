import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseRepository } from './base.repository';

type Doc = { _id: string; name: string };

class TestRepo extends BaseRepository<Doc> {
    // biome-ignore lint/complexity/noUselessConstructor: открываем protected-конструктор для теста
    constructor(model: any) {
        super(model);
    }
}

/** Цепочечный стаб Mongoose-Query. */
const chain = (result: unknown) => {
    const query: any = {};
    query.sort = vi.fn(() => query);
    query.skip = vi.fn(() => query);
    query.limit = vi.fn(() => query);
    query.session = vi.fn(() => query);
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('BaseRepository', () => {
    let model: any;
    let repo: TestRepo;

    beforeEach(() => {
        model = {
            create: vi.fn((data: Partial<Doc>) => Promise.resolve({ _id: '1', ...data })),
            findById: vi.fn(() => chain({ _id: '1', name: 'a' })),
            findOne: vi.fn(() => chain({ _id: '1', name: 'a' })),
            find: vi.fn(() =>
                chain([
                    { _id: '1', name: 'a' },
                    { _id: '2', name: 'b' },
                ]),
            ),
            countDocuments: vi.fn(() => chain(42)),
            findByIdAndUpdate: vi.fn(() => chain({ _id: '1', name: 'updated' })),
            findByIdAndDelete: vi.fn(() => chain({ _id: '1', name: 'a' })),
            exists: vi.fn(() => Promise.resolve({ _id: '1' })),
        };
        repo = new TestRepo(model);
    });

    it('create передаёт данные модели', async () => {
        const doc = await repo.create({ name: 'x' });
        expect(model.create).toHaveBeenCalledWith({ name: 'x' });
        expect(doc).toMatchObject({ name: 'x' });
    });

    it('findById / findOne проксируют в модель', async () => {
        expect(await repo.findById('1')).toMatchObject({ name: 'a' });
        expect(model.findById).toHaveBeenCalledWith('1');
        expect(await repo.findOne({ name: 'a' })).toMatchObject({ name: 'a' });
    });

    it('find применяет сортировку при наличии', async () => {
        const list = await repo.find({}, { sort: { name: 1 } });
        expect(list).toHaveLength(2);
        const query = model.find.mock.results[0].value;
        expect(query.sort).toHaveBeenCalledWith({ name: 1 });
    });

    it('findPaginated считает skip/limit и собирает meta', async () => {
        const page = await repo.findPaginated({}, { page: 2, pageSize: 20 });
        const query = model.find.mock.results[0].value;
        expect(query.skip).toHaveBeenCalledWith(20);
        expect(query.limit).toHaveBeenCalledWith(20);
        expect(page.data).toHaveLength(2);
        expect(page.meta).toEqual({
            page: 2,
            pageSize: 20,
            total: 42,
            totalPages: 3,
            hasNext: true,
            hasPrev: true,
        });
    });

    it('updateById возвращает обновлённый документ', async () => {
        const doc = await repo.updateById('1', { name: 'updated' });
        expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
            '1',
            { name: 'updated' },
            { new: true },
        );
        expect(doc).toMatchObject({ name: 'updated' });
    });

    it('deleteById возвращает true при удалении и false если не найдено', async () => {
        expect(await repo.deleteById('1')).toBe(true);
        model.findByIdAndDelete = vi.fn(() => chain(null));
        expect(await repo.deleteById('404')).toBe(false);
    });

    it('count проксирует countDocuments', async () => {
        expect(await repo.count({ name: 'a' })).toBe(42);
        expect(model.countDocuments).toHaveBeenCalledWith({ name: 'a' });
    });

    it('exists возвращает булево', async () => {
        expect(await repo.exists({ name: 'a' })).toBe(true);
        model.exists = vi.fn(() => Promise.resolve(null));
        expect(await repo.exists({ name: 'z' })).toBe(false);
    });

    describe('транзакционная сессия', () => {
        const session = { id: 'sess' } as never;

        it('create в сессии шлёт массив + options', async () => {
            model.create = vi.fn(() => Promise.resolve([{ _id: '1', name: 'x' }]));
            const doc = await repo.create({ name: 'x' }, session);
            expect(model.create).toHaveBeenCalledWith([{ name: 'x' }], { session });
            expect(doc).toMatchObject({ name: 'x' });
        });

        it('updateById в сессии добавляет session в options', async () => {
            await repo.updateById('1', { name: 'u' }, session);
            expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
                '1',
                { name: 'u' },
                {
                    new: true,
                    session,
                },
            );
        });

        it('findById/findOne в сессии вызывают query.session', async () => {
            await repo.findById('1', session);
            const q1 = model.findById.mock.results[0].value;
            expect(q1.session).toHaveBeenCalledWith(session);
            await repo.findOne({ name: 'a' }, session);
            const q2 = model.findOne.mock.results[0].value;
            expect(q2.session).toHaveBeenCalledWith(session);
        });
    });
});
