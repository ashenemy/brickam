import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExchangeRatesRepository } from './exchange-rates.repository';

const findChain = (result: unknown) => {
    const query: any = {};
    query.sort = vi.fn(() => query);
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

const aggregateChain = (result: unknown) => {
    const query: any = {};
    query.exec = vi.fn(() => Promise.resolve(result));
    return query;
};

describe('ExchangeRatesRepository', () => {
    let model: any;
    let repo: ExchangeRatesRepository;

    beforeEach(() => {
        model = {
            findOne: vi.fn(() => findChain({ currency: 'USD', rate: 400 })),
            aggregate: vi.fn(() => aggregateChain([{ doc: { currency: 'USD', rate: 400 } }])),
        };
        repo = new ExchangeRatesRepository(model);
    });

    it('latestByCurrency ищет по currency и сортирует по fetchedAt desc', async () => {
        const doc = await repo.latestByCurrency('USD');
        expect(model.findOne).toHaveBeenCalledWith({ currency: 'USD' });
        expect(doc).toMatchObject({ currency: 'USD', rate: 400 });
    });

    it('latestAll агрегирует по последней записи на валюту', async () => {
        const docs = await repo.latestAll();
        expect(model.aggregate).toHaveBeenCalled();
        expect(docs).toEqual([{ currency: 'USD', rate: 400 }]);
    });
});
