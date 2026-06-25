import type { BulkOp, ProductBulkView } from '@brickam/domain-kit';
import { describe, expect, it } from 'vitest';
import { computeBulk } from './bulk-calc.util';

const makeView = (over: Partial<ProductBulkView> = {}): ProductBulkView => ({
    id: 'p1',
    price: 1000,
    stock: 5,
    status: 'active',
    categoryId: 'c1',
    title: { hy: '', ru: 'Цемент', en: 'Cement' },
    ...over,
});

describe('computeBulk', () => {
    describe('price', () => {
        it('percent: roundAmd(price*(1+value/100))', () => {
            const op: BulkOp = { kind: 'price', mode: 'percent', value: 10 };
            const { previews, updates } = computeBulk([makeView({ price: 1000 })], op);
            expect(previews[0]!.before).toEqual({ price: 1000 });
            expect(previews[0]!.after).toEqual({ price: 1100 });
            expect(updates[0]!.fields).toEqual({ price: 1100 });
        });

        it('percent: округляет дробный результат', () => {
            const op: BulkOp = { kind: 'price', mode: 'percent', value: 5 };
            const { updates } = computeBulk([makeView({ price: 999 })], op);
            // 999 * 1.05 = 1048.95 → 1049
            expect(updates[0]!.fields.price).toBe(1049);
        });

        it('amount: price+value', () => {
            const op: BulkOp = { kind: 'price', mode: 'amount', value: 250 };
            const { updates } = computeBulk([makeView({ price: 1000 })], op);
            expect(updates[0]!.fields.price).toBe(1250);
        });

        it('amount: не уходит ниже 0', () => {
            const op: BulkOp = { kind: 'price', mode: 'amount', value: -5000 };
            const { previews, updates } = computeBulk([makeView({ price: 1000 })], op);
            expect(previews[0]!.after).toEqual({ price: 0 });
            expect(updates[0]!.fields.price).toBe(0);
        });

        it('set: фиксирует значение (не ниже 0)', () => {
            const op: BulkOp = { kind: 'price', mode: 'set', value: 777 };
            const { updates } = computeBulk([makeView({ price: 1000 })], op);
            expect(updates[0]!.fields.price).toBe(777);
            const neg = computeBulk([makeView({ price: 1000 })], {
                kind: 'price',
                mode: 'set',
                value: -10,
            });
            expect(neg.updates[0]!.fields.price).toBe(0);
        });

        it('без изменения цены → update пустой, превью есть', () => {
            const op: BulkOp = { kind: 'price', mode: 'amount', value: 0 };
            const { previews, updates } = computeBulk([makeView({ price: 1000 })], op);
            expect(previews).toHaveLength(1);
            expect(updates).toHaveLength(0);
        });
    });

    describe('discount', () => {
        it('discountSet: fields.discount = op.discount', () => {
            const discount = { type: 'percent' as const, value: 15 };
            const op: BulkOp = { kind: 'discountSet', discount };
            const { previews, updates } = computeBulk([makeView()], op);
            expect(previews[0]!.before).toEqual({ discount: null });
            expect(previews[0]!.after).toEqual({ discount });
            expect(updates[0]!.fields).toEqual({ discount });
        });

        it('discountSet: та же скидка → без апдейта', () => {
            const discount = { type: 'percent' as const, value: 15 };
            const op: BulkOp = { kind: 'discountSet', discount };
            const { updates } = computeBulk([makeView({ discount })], op);
            expect(updates).toHaveLength(0);
        });

        it('discountRemove: fields.discount = null если была скидка', () => {
            const op: BulkOp = { kind: 'discountRemove' };
            const view = makeView({ discount: { type: 'amount', value: 100 } });
            const { previews, updates } = computeBulk([view], op);
            expect(previews[0]!.before).toEqual({ discount: { type: 'amount', value: 100 } });
            expect(previews[0]!.after).toEqual({ discount: null });
            expect(updates[0]!.fields).toEqual({ discount: null });
        });

        it('discountRemove: нет скидки → без апдейта', () => {
            const op: BulkOp = { kind: 'discountRemove' };
            const { updates } = computeBulk([makeView()], op);
            expect(updates).toHaveLength(0);
        });
    });

    describe('stock', () => {
        it('set: value', () => {
            const op: BulkOp = { kind: 'stock', mode: 'set', value: 42 };
            const { previews, updates } = computeBulk([makeView({ stock: 5 })], op);
            expect(previews[0]!.before).toEqual({ stock: 5 });
            expect(previews[0]!.after).toEqual({ stock: 42 });
            expect(updates[0]!.fields).toEqual({ stock: 42 });
        });

        it('inc: stock+value', () => {
            const op: BulkOp = { kind: 'stock', mode: 'inc', value: 3 };
            const { updates } = computeBulk([makeView({ stock: 5 })], op);
            expect(updates[0]!.fields.stock).toBe(8);
        });

        it('inc: не уходит ниже 0', () => {
            const op: BulkOp = { kind: 'stock', mode: 'inc', value: -100 };
            const { previews, updates } = computeBulk([makeView({ stock: 5 })], op);
            expect(previews[0]!.after).toEqual({ stock: 0 });
            expect(updates[0]!.fields.stock).toBe(0);
        });

        it('без изменения остатка → без апдейта', () => {
            const op: BulkOp = { kind: 'stock', mode: 'set', value: 5 };
            const { updates } = computeBulk([makeView({ stock: 5 })], op);
            expect(updates).toHaveLength(0);
        });
    });

    describe('status', () => {
        it('меняет статус', () => {
            const op: BulkOp = { kind: 'status', status: 'hidden' };
            const { previews, updates } = computeBulk([makeView({ status: 'active' })], op);
            expect(previews[0]!.before).toEqual({ status: 'active' });
            expect(previews[0]!.after).toEqual({ status: 'hidden' });
            expect(updates[0]!.fields).toEqual({ status: 'hidden' });
        });

        it('тот же статус → без апдейта', () => {
            const op: BulkOp = { kind: 'status', status: 'active' };
            const { updates } = computeBulk([makeView({ status: 'active' })], op);
            expect(updates).toHaveLength(0);
        });
    });

    describe('category', () => {
        it('меняет categoryId', () => {
            const op: BulkOp = { kind: 'category', categoryId: 'c2' };
            const { previews, updates } = computeBulk([makeView({ categoryId: 'c1' })], op);
            expect(previews[0]!.before).toEqual({ categoryId: 'c1' });
            expect(previews[0]!.after).toEqual({ categoryId: 'c2' });
            expect(updates[0]!.fields).toEqual({ categoryId: 'c2' });
        });

        it('та же категория → без апдейта', () => {
            const op: BulkOp = { kind: 'category', categoryId: 'c1' };
            const { updates } = computeBulk([makeView({ categoryId: 'c1' })], op);
            expect(updates).toHaveLength(0);
        });
    });

    it('обрабатывает несколько товаров: previews для всех, updates только изменённые', () => {
        const op: BulkOp = { kind: 'price', mode: 'set', value: 1000 };
        const views = [makeView({ id: 'p1', price: 500 }), makeView({ id: 'p2', price: 1000 })];
        const { previews, updates } = computeBulk(views, op);
        expect(previews).toHaveLength(2);
        expect(updates).toHaveLength(1);
        expect(updates[0]!.productId).toBe('p1');
    });

    it('пустой вход → пустые previews/updates', () => {
        const { previews, updates } = computeBulk([], { kind: 'discountRemove' });
        expect(previews).toEqual([]);
        expect(updates).toEqual([]);
    });
});
