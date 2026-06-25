import { describe, expect, it } from 'vitest';
import type { Invoice } from './invoice.schema';
import { InvoicePdfService } from './invoice-pdf.service';

const makeInvoice = (): Invoice =>
    ({
        invoiceNumber: 'INV-AAA-001',
        chatId: 'c1',
        vendorId: 'v1',
        buyerId: 'b1',
        lineItems: [{ title: 'Brick', qty: 100, price: 50 }],
        discount: { type: 'percent', value: 10 },
        subtotal: 5000,
        total: 4500,
        currency: 'AMD',
        validUntil: new Date('2026-12-31T00:00:00Z'),
        status: 'sent',
    }) as unknown as Invoice;

describe('InvoicePdfService', () => {
    it('возвращает непустой PDF-Buffer (%PDF-сигнатура)', async () => {
        const service = new InvoicePdfService();
        const buffer = await service.generate(makeInvoice());
        expect(Buffer.isBuffer(buffer)).toBe(true);
        expect(buffer.length).toBeGreaterThan(0);
        expect(buffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
    });
});
