import type { BulkPreviewItem, BulkUpdate } from '@brickam/domain-kit';

/** Результат расчёта массовой операции: превью (до/после) + точечные апдейты. */
export type BulkComputeResult = {
    previews: BulkPreviewItem[];
    updates: BulkUpdate[];
};

/** Результат предпросмотра массовой операции (без записи). */
export type BulkPreviewResult = {
    affected: number;
    previews: BulkPreviewItem[];
};

/** Результат применения массовой операции (синхронно либо поставлено в очередь). */
export type BulkApplyResult =
    | { mode: 'sync'; modified: number }
    | { mode: 'queued'; jobId: string; affected: number };

/** Полезная нагрузка job'а очереди vendor-bulk. */
export type BulkJobData = {
    vendorId: string;
    updates: BulkUpdate[];
};
