import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IdempotencyRepository } from './idempotency.repository';

const chain = (result: unknown) => {
    const query: any = {};
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('IdempotencyRepository', () => {
    let model: any;
    let repo: IdempotencyRepository;

    beforeEach(() => {
        model = {
            findOne: vi.fn(() => chain({ key: 'k1' })),
            create: vi.fn(() => Promise.resolve({ key: 'k1' })),
            findOneAndUpdate: vi.fn(() => chain({ key: 'k1', status: 'completed' })),
            deleteOne: vi.fn(() => chain({ deletedCount: 1 })),
        };
        repo = new IdempotencyRepository(model);
    });

    it('findByKey ищет по key', async () => {
        const doc = await repo.findByKey('k1');
        expect(model.findOne).toHaveBeenCalledWith({ key: 'k1' });
        expect(doc).toMatchObject({ key: 'k1' });
    });

    it('insertPending вставляет запись', async () => {
        const doc = await repo.insertPending({ key: 'k1' });
        expect(model.create).toHaveBeenCalled();
        expect(doc).toMatchObject({ key: 'k1' });
    });

    it('insertPending возвращает null при duplicate key (E11000)', async () => {
        model.create = vi.fn(() => Promise.reject({ code: 11000 }));
        const doc = await repo.insertPending({ key: 'k1' });
        expect(doc).toBeNull();
    });

    it('insertPending пробрасывает прочие ошибки', async () => {
        model.create = vi.fn(() => Promise.reject(new Error('boom')));
        await expect(repo.insertPending({ key: 'k1' })).rejects.toThrow('boom');
    });

    it('markCompleted обновляет статус/код/ответ', async () => {
        await repo.markCompleted('k1', 201, { ok: true });
        expect(model.findOneAndUpdate).toHaveBeenCalledWith(
            { key: 'k1' },
            { status: 'completed', statusCode: 201, response: { ok: true } },
            { new: true },
        );
    });

    it('deleteByKey удаляет запись и сигналит успех', async () => {
        const ok = await repo.deleteByKey('k1');
        expect(model.deleteOne).toHaveBeenCalledWith({ key: 'k1' });
        expect(ok).toBe(true);
    });

    it('deleteByKey возвращает false если ничего не удалено', async () => {
        model.deleteOne = vi.fn(() => chain({ deletedCount: 0 }));
        const ok = await repo.deleteByKey('missing');
        expect(ok).toBe(false);
    });
});
