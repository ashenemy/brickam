import { type BulkOp, CatalogBulkContract } from '@brickam/domain-kit';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import type { BulkApplyResult, BulkPreviewResult } from '../@types';
import { computeBulk } from './bulk-calc.util';
import { BULK_QUEUE } from './vendor-bulk.constants';

/**
 * Порог числа реальных апдейтов, до которого массовая операция применяется
 * синхронно. Большие наборы уходят в фоновую очередь, чтобы не держать HTTP.
 */
export const SYNC_THRESHOLD = 50;

/**
 * Сервис массовых операций над товарами вендора (Foundations §14). Все операции
 * SCOPED по вендору: проекции и апдиты приходят/уходят через CatalogBulkContract
 * (catalog — владелец товаров). Малые наборы применяются синхронно, большие —
 * через BullMQ-очередь.
 */
@Injectable()
export class BulkService {
    constructor(
        private readonly catalogBulk: CatalogBulkContract,
        @InjectQueue(BULK_QUEUE) private readonly queue: Queue,
    ) {}

    /**
     * Предпросмотр массовой операции: проекции товаров вендора → расчёт до/после.
     * Запись в БД не выполняется.
     */
    async preview(vendorId: string, productIds: string[], op: BulkOp): Promise<BulkPreviewResult> {
        const views = await this.catalogBulk.listForBulk(vendorId, productIds);
        const { previews } = computeBulk(views, op);
        return { affected: previews.length, previews };
    }

    /**
     * Применяет массовую операцию. Если реальных апдейтов `<= SYNC_THRESHOLD` —
     * пишет синхронно через CatalogBulkContract (`mode: 'sync'`). Иначе ставит
     * job в очередь vendor-bulk (`mode: 'queued'`) — обработка фоном.
     */
    async apply(vendorId: string, productIds: string[], op: BulkOp): Promise<BulkApplyResult> {
        const views = await this.catalogBulk.listForBulk(vendorId, productIds);
        const { updates } = computeBulk(views, op);

        if (updates.length <= SYNC_THRESHOLD) {
            const { modified } = await this.catalogBulk.applyBulk(vendorId, updates);
            return { mode: 'sync', modified };
        }

        const job = await this.queue.add('apply', { vendorId, updates });
        return { mode: 'queued', jobId: String(job.id), affected: updates.length };
    }
}
