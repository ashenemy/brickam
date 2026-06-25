import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Invoice, InvoiceSchema } from './invoice.schema';
import { InvoicePdfService } from './invoice-pdf.service';
import { InvoicesController } from './invoices.controller';
import { InvoicesRepository } from './invoices.repository';
import { InvoicesService } from './invoices.service';

/**
 * Модуль инвойсов (Foundations §15, Stage 9). НЕ @Global — orders/chat
 * приходят глобально по DI-контрактам. Зависит только от kit/domain
 * (граница feature → не импортирует другие feature).
 */
@Module({
    imports: [MongooseModule.forFeature([{ name: Invoice.name, schema: InvoiceSchema }])],
    controllers: [InvoicesController],
    providers: [InvoicesRepository, InvoicesService, InvoicePdfService],
    exports: [InvoicesService],
})
export class InvoicesModule {}
