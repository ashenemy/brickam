import {
    type BulkOp,
    type BulkPreviewItem,
    type BulkProductFields,
    type BulkUpdate,
    type DiscountInput,
    type ProductBulkView,
    roundAmd,
} from '@brickam/domain-kit';
import type { BulkComputeResult } from '../@types';

/**
 * Вычисляет новую цену по операции `price`:
 * - percent → `roundAmd(price * (1 + value/100))`;
 * - amount  → `roundAmd(price + value)`;
 * - set     → `roundAmd(value)`.
 * Цена не может быть отрицательной (`Math.max(0, …)`).
 */
const computePrice = (price: number, op: Extract<BulkOp, { kind: 'price' }>): number => {
    if (op.mode === 'percent') {
        return Math.max(0, roundAmd(price * (1 + op.value / 100)));
    }
    if (op.mode === 'amount') {
        return Math.max(0, roundAmd(price + op.value));
    }
    return Math.max(0, roundAmd(op.value));
};

/**
 * Вычисляет новый остаток по операции `stock`:
 * - set → value; inc → `stock + value`. Остаток не может быть отрицательным.
 */
const computeStock = (stock: number, op: Extract<BulkOp, { kind: 'stock' }>): number => {
    const next = op.mode === 'set' ? op.value : stock + op.value;
    return Math.max(0, next);
};

/** Скидки эквивалентны, если совпали тип и величина. */
const sameDiscount = (a: DiscountInput | undefined, b: DiscountInput): boolean =>
    a !== undefined && a.type === b.type && a.value === b.value;

/**
 * Чистая функция расчёта массовой операции над проекциями товаров (Foundations
 * §14). Для каждого товара формирует `before`/`after` по релевантным полям и
 * `updates`, содержащий ТОЛЬКО реально изменившиеся поля. Товары без изменений
 * в `updates` не попадают (но всегда присутствуют в `previews`).
 */
export const computeBulk = (views: ProductBulkView[], op: BulkOp): BulkComputeResult => {
    const previews: BulkPreviewItem[] = [];
    const updates: BulkUpdate[] = [];

    for (const view of views) {
        const before: BulkProductFields = {};
        const after: BulkProductFields = {};
        const fields: BulkProductFields = {};

        switch (op.kind) {
            case 'price': {
                const next = computePrice(view.price, op);
                before.price = view.price;
                after.price = next;
                if (next !== view.price) {
                    fields.price = next;
                }
                break;
            }
            case 'discountSet': {
                before.discount = view.discount ?? null;
                after.discount = op.discount;
                if (!sameDiscount(view.discount, op.discount)) {
                    fields.discount = op.discount;
                }
                break;
            }
            case 'discountRemove': {
                before.discount = view.discount ?? null;
                after.discount = null;
                if (view.discount !== undefined) {
                    fields.discount = null;
                }
                break;
            }
            case 'stock': {
                const next = computeStock(view.stock, op);
                before.stock = view.stock;
                after.stock = next;
                if (next !== view.stock) {
                    fields.stock = next;
                }
                break;
            }
            case 'status': {
                before.status = view.status;
                after.status = op.status;
                if (op.status !== view.status) {
                    fields.status = op.status;
                }
                break;
            }
            case 'category': {
                before.categoryId = view.categoryId;
                after.categoryId = op.categoryId;
                if (op.categoryId !== view.categoryId) {
                    fields.categoryId = op.categoryId;
                }
                break;
            }
        }

        previews.push({ productId: view.id, title: view.title, before, after });
        if (Object.keys(fields).length > 0) {
            updates.push({ productId: view.id, fields });
        }
    }

    return { previews, updates };
};
