import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Invoice, type InvoiceDocument } from './invoice.schema';

/** Репозиторий инвойсов поверх Mongoose-модели Invoice (Foundations §7). */
@Injectable()
export class InvoicesRepository extends BaseRepository<Invoice> {
    constructor(@InjectModel(Invoice.name) model: Model<Invoice>) {
        super(model);
    }

    /** Находит инвойс по номеру (уникальный индекс invoiceNumber). */
    findByNumber(invoiceNumber: string): Promise<InvoiceDocument | null> {
        return this.findOne({ invoiceNumber });
    }

    /** Инвойсы диалога (по chatId, новые первыми). */
    findByChat(chatId: string): Promise<InvoiceDocument[]> {
        return this.find({ chatId }, { sort: { createdAt: -1 } });
    }
}
