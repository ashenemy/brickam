import { describe, expect, it } from 'vitest';
import type { OrderLineInput } from '../@types';
import { calculateOrder } from './order-calc';

const COMMISSION = 7.5;

describe('calculateOrder (Foundations §11)', () => {
    it('один вендор без скидок: total, комиссия, payout', () => {
        const lines: OrderLineInput[] = [
            { productId: 'p1', vendorId: 'v1', qty: 2, price: 1000 },
            { productId: 'p2', vendorId: 'v1', qty: 1, price: 500 },
        ];
        const r = calculateOrder(lines, COMMISSION);
        expect(r.subtotal).toBe(2500);
        expect(r.productDiscountTotal).toBe(0);
        expect(r.total).toBe(2500);
        expect(r.vendors).toHaveLength(1);
        const v = r.vendors[0];
        expect(v.subtotal).toBe(2500);
        expect(v.commissionAmount).toBe(188); // round(2500*7.5/100=187.5)
        expect(v.payoutAmount).toBe(2312);
        expect(r.splits).toEqual([
            { vendorId: 'v1', amount: 2500, commissionAmount: 188, payoutAmount: 2312 },
        ]);
    });

    it('комиссия считается на сумму ПОСЛЕ товарной скидки', () => {
        const lines: OrderLineInput[] = [
            {
                productId: 'p1',
                vendorId: 'v1',
                qty: 1,
                price: 1000,
                discount: { type: 'percent', value: 20 },
            },
        ];
        const r = calculateOrder(lines, COMMISSION);
        expect(r.subtotal).toBe(1000);
        expect(r.productDiscountTotal).toBe(200);
        expect(r.total).toBe(800);
        expect(r.vendors[0].subtotal).toBe(800);
        expect(r.vendors[0].commissionAmount).toBe(60); // round(800*7.5/100)
        expect(r.vendors[0].payoutAmount).toBe(740);
    });

    it('мультивендорный заказ: один платёж разбит по вендорам, сумма сплитов = total', () => {
        const lines: OrderLineInput[] = [
            { productId: 'a', vendorId: 'v1', qty: 1, price: 1000 },
            {
                productId: 'b',
                vendorId: 'v2',
                qty: 2,
                price: 700,
                discount: { type: 'amount', value: 100 },
            },
            { productId: 'c', vendorId: 'v1', qty: 1, price: 300 },
        ];
        const r = calculateOrder(lines, COMMISSION);
        // v1: 1000+300=1300; v2: (700-100)*2=1200
        expect(r.total).toBe(2500);
        const sumSplits = r.splits.reduce((s, x) => s + x.amount, 0);
        expect(sumSplits).toBe(r.total);
        const v1 = r.splits.find((s) => s.vendorId === 'v1')!;
        const v2 = r.splits.find((s) => s.vendorId === 'v2')!;
        expect(v1.amount).toBe(1300);
        expect(v2.amount).toBe(1200);
        expect(v1.commissionAmount).toBe(98); // round(1300*7.5/100=97.5)
        expect(v1.payoutAmount).toBe(1202);
        expect(v2.commissionAmount).toBe(90); // 1200*7.5/100
        expect(v2.payoutAmount).toBe(1110);
    });

    it('позиции вендора несут unitPrice/discountApplied/lineTotal', () => {
        const r = calculateOrder(
            [
                {
                    productId: 'p1',
                    vendorId: 'v1',
                    qty: 3,
                    price: 200,
                    discount: { type: 'amount', value: 50 },
                },
            ],
            COMMISSION,
        );
        const item = r.vendors[0].items[0];
        expect(item).toMatchObject({
            productId: 'p1',
            qty: 3,
            unitPrice: 200,
            discountApplied: 50,
            lineTotal: 450,
        });
    });

    it('loyaltyDiscount пока 0', () => {
        const r = calculateOrder(
            [{ productId: 'p1', vendorId: 'v1', qty: 1, price: 100 }],
            COMMISSION,
        );
        expect(r.loyaltyDiscount).toBe(0);
    });
});
