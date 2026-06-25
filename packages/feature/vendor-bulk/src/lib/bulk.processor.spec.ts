import type { CatalogBulkContract } from '@brickam/domain-kit';
import type { Job } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BulkJobData } from '../@types';
import { BulkProcessor } from './bulk.processor';

describe('BulkProcessor', () => {
    let catalogBulk: { applyBulk: ReturnType<typeof vi.fn> };
    let processor: BulkProcessor;

    beforeEach(() => {
        catalogBulk = { applyBulk: vi.fn().mockResolvedValue({ modified: 2 }) };
        processor = new BulkProcessor(catalogBulk as unknown as CatalogBulkContract);
    });

    it('process делегирует applyBulk(vendorId, updates) и возвращает результат', async () => {
        const updates = [
            { productId: 'p1', fields: { price: 1000 } },
            { productId: 'p2', fields: { stock: 3 } },
        ];
        const job = {
            id: 'job-1',
            data: { vendorId: 'v1', updates } as BulkJobData,
        } as Job<BulkJobData>;

        const result = await processor.process(job);

        expect(catalogBulk.applyBulk).toHaveBeenCalledWith('v1', updates);
        expect(result).toEqual({ modified: 2 });
    });
});
