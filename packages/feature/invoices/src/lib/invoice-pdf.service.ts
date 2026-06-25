import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { Invoice } from './invoice.schema';

/**
 * Генерация PDF инвойса на pdfkit (Foundations §15, Stage 9). Документ
 * собирается в память (chunks → Buffer.concat); на диск ничего не пишется.
 */
@Injectable()
export class InvoicePdfService {
    /** Строит PDF инвойса и возвращает его как Buffer. */
    generate(invoice: Invoice): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk: Buffer) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err: Error) => reject(err));

            this.render(doc, invoice);
            doc.end();
        });
    }

    /** Рисует содержимое инвойса. */
    private render(doc: PDFKit.PDFDocument, invoice: Invoice): void {
        // Шапка.
        doc.fontSize(20).text(`Invoice ${invoice.invoiceNumber}`, { align: 'left' });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text(`Status: ${invoice.status}`);
        doc.text(`Vendor: ${invoice.vendorId}`);
        doc.text(`Buyer: ${invoice.buyerId}`);
        doc.text(`Valid until: ${invoice.validUntil.toISOString()}`);
        doc.moveDown(1);

        // Таблица позиций.
        doc.fontSize(12).text('Items', { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10);
        for (const item of invoice.lineItems) {
            const lineTotal = item.price * item.qty;
            doc.text(
                `${item.title}  —  ${item.qty} x ${item.price} = ${lineTotal} ${invoice.currency}`,
            );
        }
        doc.moveDown(1);

        // Итоги.
        doc.text(`Subtotal: ${invoice.subtotal} ${invoice.currency}`);
        if (invoice.discount) {
            doc.text(`Discount: ${invoice.discount.type} ${invoice.discount.value}`);
        }
        doc.fontSize(12).text(`Total: ${invoice.total} ${invoice.currency}`, { underline: true });
    }
}
