import { ValidationException } from '@brickam/core-kit';
import type { BulkOp } from '@brickam/domain-kit';
import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsObject, IsString } from 'class-validator';

/** Допустимые виды массовой операции (дискриминатор `kind`). */
const BULK_OP_KINDS = [
    'price',
    'discountSet',
    'discountRemove',
    'stock',
    'status',
    'category',
] as const;

/**
 * Проверяет, что произвольный объект — корректный `BulkOp`. Бросает
 * `ValidationException('errors.bulk.invalidOp')` при несоответствии. Сужает тип
 * для безопасного использования ниже по стеку.
 */
export function assertBulkOp(raw: unknown): asserts raw is BulkOp {
    if (typeof raw !== 'object' || raw === null) {
        throw new ValidationException('errors.bulk.invalidOp');
    }
    const op = raw as Record<string, unknown>;
    const kind = op['kind'];

    switch (kind) {
        case 'price':
            if (
                !['percent', 'amount', 'set'].includes(op['mode'] as string) ||
                typeof op['value'] !== 'number'
            ) {
                throw new ValidationException('errors.bulk.invalidOp');
            }
            return;
        case 'stock':
            if (!['set', 'inc'].includes(op['mode'] as string) || typeof op['value'] !== 'number') {
                throw new ValidationException('errors.bulk.invalidOp');
            }
            return;
        case 'discountSet': {
            const discount = op['discount'] as Record<string, unknown> | undefined;
            if (
                !discount ||
                !['percent', 'amount'].includes(discount['type'] as string) ||
                typeof discount['value'] !== 'number'
            ) {
                throw new ValidationException('errors.bulk.invalidOp');
            }
            return;
        }
        case 'discountRemove':
            return;
        case 'status':
            if (!['active', 'hidden'].includes(op['status'] as string)) {
                throw new ValidationException('errors.bulk.invalidOp');
            }
            return;
        case 'category':
            if (typeof op['categoryId'] !== 'string' || op['categoryId'].length === 0) {
                throw new ValidationException('errors.bulk.invalidOp');
            }
            return;
        default:
            throw new ValidationException('errors.bulk.invalidOp');
    }
}

/**
 * Базовое тело массового запроса: список товаров + операция. `op` —
 * дискриминированный union (`BulkOp`) по `kind`; class-validator не выражает
 * union напрямую, поэтому форма проверяется вручную в `assertBulkOp` на уровне
 * контроллера. Здесь гарантируем лишь, что это объект.
 */
export class BulkRequestDto {
    @ApiProperty({ type: [String], description: 'Идентификаторы товаров вендора' })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    productIds!: string[];

    @ApiProperty({
        description: `Массовая операция (union по kind: ${BULK_OP_KINDS.join(', ')})`,
        type: 'object',
        additionalProperties: true,
    })
    @IsObject()
    op!: Record<string, unknown>;
}
