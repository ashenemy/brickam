import { CatalogBulkContract } from '@brickam/domain-kit';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import type { BulkJobData } from '../@types';
import { BULK_QUEUE } from './vendor-bulk.constants';

/**
 * Фоновый обработчик очереди vendor-bulk (Foundations §14). Применяет уже
 * рассчитанные точечные апдейты через CatalogBulkContract (SCOPED по вендору).
 * Большие наборы обрабатываются здесь, чтобы не держать HTTP-запрос.
 */
@Processor(BULK_QUEUE)
export class BulkProcessor extends WorkerHost {
    private readonly logger = new Logger(BulkProcessor.name);

    constructor(private readonly catalogBulk: CatalogBulkContract) {
        super();
    }

    /** Обрабатывает job `{vendorId, updates}` → applyBulk; отдаёт кол-во изменённых. */
    async process(job: Job<BulkJobData>): Promise<{ modified: number }> {
        const { vendorId, updates } = job.data;
        const result = await this.catalogBulk.applyBulk(vendorId, updates);
        this.logger.log(
            `vendor-bulk job ${job.id}: вендор ${vendorId}, изменено ${result.modified}/${updates.length}`,
        );
        return result;
    }
}
