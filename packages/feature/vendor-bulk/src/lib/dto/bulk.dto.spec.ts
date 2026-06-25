import { ValidationException } from '@brickam/core-kit';
import { describe, expect, it } from 'vitest';
import { assertBulkOp } from './bulk.dto';

describe('assertBulkOp', () => {
    const valid: unknown[] = [
        { kind: 'price', mode: 'percent', value: 10 },
        { kind: 'price', mode: 'amount', value: -5 },
        { kind: 'price', mode: 'set', value: 100 },
        { kind: 'stock', mode: 'set', value: 0 },
        { kind: 'stock', mode: 'inc', value: 3 },
        { kind: 'discountSet', discount: { type: 'percent', value: 15 } },
        { kind: 'discountRemove' },
        { kind: 'status', status: 'active' },
        { kind: 'status', status: 'hidden' },
        { kind: 'category', categoryId: 'c1' },
    ];

    it.each(valid)('пропускает корректную операцию %o', (op) => {
        expect(() => assertBulkOp(op)).not.toThrow();
    });

    const invalid: unknown[] = [
        null,
        'str',
        {},
        { kind: 'unknown' },
        { kind: 'price', mode: 'bad', value: 1 },
        { kind: 'price', mode: 'set', value: 'x' },
        { kind: 'stock', mode: 'bad', value: 1 },
        { kind: 'discountSet' },
        { kind: 'discountSet', discount: { type: 'bad', value: 1 } },
        { kind: 'status', status: 'bad' },
        { kind: 'category', categoryId: '' },
    ];

    it.each(invalid)('отклоняет некорректную операцию %o', (op) => {
        expect(() => assertBulkOp(op)).toThrow(ValidationException);
    });
});
