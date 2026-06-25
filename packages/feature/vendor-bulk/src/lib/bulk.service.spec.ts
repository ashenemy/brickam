import type { BulkOp, CatalogBulkContract, ProductBulkView } from '@brickam/domain-kit';
import type { Queue } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BulkService, SYNC_THRESHOLD } from './bulk.service';

const makeView = (over: Partial<ProductBulkView> = {}): ProductBulkView => ({
    id: 'p1',
    price: 1000,
    stock: 5,
    status: 'active',
    categoryId: 'c1',
    title: { hy: '', ru: 'Цемент', en: 'Cement' },
    ...over,
});

describe('BulkService', () => {
    let catalogBulk: {
        listForBulk: ReturnType<typeof vi.fn>;
        applyBulk: ReturnType<typeof vi.fn>;
    };
    let queue: { add: ReturnType<typeof vi.fn> };
    let service: BulkService;

    const op: BulkOp = { kind: 'price', mode: 'set', value: 2000 };

    beforeEach(() => {
        catalogBulk = {
            listForBulk: vi.fn(),
            applyBulk: vi.fn().mockResolvedValue({ modified: 0 }),
        };
        queue = { add: vi.fn().mockResolvedValue({ id: 'job-1' }) };
        service = new BulkService(
            catalogBulk as unknown as CatalogBulkContract,
            queue as unknown as Queue,
        );
    });

    describe('preview', () => {
        it('возвращает previews без записи (applyBulk/queue не вызваны)', async () => {
            catalogBulk.listForBulk.mockResolvedValue([
                makeView({ id: 'p1', price: 1000 }),
                makeView({ id: 'p2', price: 2000 }),
            ]);
            const result = await service.preview('v1', ['p1', 'p2'], op);
            expect(catalogBulk.listForBulk).toHaveBeenCalledWith('v1', ['p1', 'p2']);
            expect(result.affected).toBe(2);
            expect(result.previews).toHaveLength(2);
            expect(catalogBulk.applyBulk).not.toHaveBeenCalled();
            expect(queue.add).not.toHaveBeenCalled();
        });
    });

    describe('apply', () => {
        it('малый набор (<= порога) → applyBulk синхронно, mode sync', async () => {
            catalogBulk.listForBulk.mockResolvedValue([makeView({ id: 'p1', price: 1000 })]);
            catalogBulk.applyBulk.mockResolvedValue({ modified: 1 });
            const result = await service.apply('v1', ['p1'], op);
            expect(catalogBulk.applyBulk).toHaveBeenCalledWith('v1', [
                { productId: 'p1', fields: { price: 2000 } },
            ]);
            expect(queue.add).not.toHaveBeenCalled();
            expect(result).toEqual({ mode: 'sync', modified: 1 });
        });

        it('набор ровно на пороге → синхронно', async () => {
            const views = Array.from({ length: SYNC_THRESHOLD }, (_, i) =>
                makeView({ id: `p${i}`, price: 1000 }),
            );
            catalogBulk.listForBulk.mockResolvedValue(views);
            catalogBulk.applyBulk.mockResolvedValue({ modified: SYNC_THRESHOLD });
            const result = await service.apply('v1', [], op);
            expect(catalogBulk.applyBulk).toHaveBeenCalledTimes(1);
            expect(queue.add).not.toHaveBeenCalled();
            expect(result.mode).toBe('sync');
        });

        it('большой набор (> порога) → queue.add, applyBulk НЕ вызван синхронно', async () => {
            const views = Array.from({ length: SYNC_THRESHOLD + 1 }, (_, i) =>
                makeView({ id: `p${i}`, price: 1000 }),
            );
            catalogBulk.listForBulk.mockResolvedValue(views);
            const result = await service.apply('v1', [], op);
            expect(catalogBulk.applyBulk).not.toHaveBeenCalled();
            expect(queue.add).toHaveBeenCalledTimes(1);
            const [name, data] = queue.add.mock.calls[0]!;
            expect(name).toBe('apply');
            expect(data.vendorId).toBe('v1');
            expect(data.updates).toHaveLength(SYNC_THRESHOLD + 1);
            expect(result).toEqual({
                mode: 'queued',
                jobId: 'job-1',
                affected: SYNC_THRESHOLD + 1,
            });
        });
    });
});
