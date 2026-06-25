import type { LocalizedText } from '../products/models';

/** Конверт ответа API. */
export type ApiResponse<T> = {
    success: boolean;
    data: T;
};

/** Скидка во входе операции discountSet. */
export type DiscountInput = {
    type: 'percent' | 'amount';
    value: number;
};

/**
 * Массовая операция (дискриминатор `kind`) — точно по бэкенду
 * (packages/feature/vendor-bulk assertBulkOp).
 */
export type BulkOp =
    | { kind: 'price'; mode: 'percent' | 'amount' | 'set'; value: number }
    | { kind: 'discountSet'; discount: DiscountInput }
    | { kind: 'discountRemove' }
    | { kind: 'stock'; mode: 'set' | 'inc'; value: number }
    | { kind: 'status'; status: 'active' | 'hidden' }
    | { kind: 'category'; categoryId: string };

/** Изменяемые поля товара (до/после). */
export type BulkProductFields = {
    price?: number;
    discount?: DiscountInput | null;
    stock?: number;
    status?: string;
    categoryId?: string;
};

/** Элемент превью массовой операции. */
export type BulkPreviewItem = {
    productId: string;
    title: LocalizedText;
    before: BulkProductFields;
    after: BulkProductFields;
};

/** Результат предпросмотра. */
export type BulkPreviewResult = {
    affected: number;
    previews: BulkPreviewItem[];
};

/** Результат применения (sync — сразу, queued — в очередь). */
export type BulkApplyResult =
    | { mode: 'sync'; modified: number }
    | { mode: 'queued'; jobId: string; affected: number };

/** Тело массового запроса. */
export type BulkRequest = {
    productIds: string[];
    op: BulkOp;
};
