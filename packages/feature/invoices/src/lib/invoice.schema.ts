import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import type { InvoiceLineItem } from '@brickam/domain-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import type { InvoiceDiscount, InvoiceDiscountType, InvoiceStatus } from '../@types';

/** Вложенная позиция инвойса. */
@Schema({ _id: false })
class InvoiceLineItemEmbedded implements InvoiceLineItem {
    @Prop({ type: String, required: true })
    title!: string;

    @Prop({ type: Number, required: true, min: 1 })
    qty!: number;

    @Prop({ type: Number, required: true, min: 0 })
    price!: number;
}

const InvoiceLineItemSchema = SchemaFactory.createForClass(InvoiceLineItemEmbedded);

/** Вложенная скидка инвойса. */
@Schema({ _id: false })
class InvoiceDiscountEmbedded implements InvoiceDiscount {
    @Prop({ type: String, enum: ['percent', 'amount'], required: true })
    type!: InvoiceDiscountType;

    @Prop({ type: Number, required: true })
    value!: number;
}

const InvoiceDiscountSchema = SchemaFactory.createForClass(InvoiceDiscountEmbedded);

/**
 * Кастомный инвойс продавца покупателю (Foundations §15, Stage 9). Создаётся
 * в диалоге чата; оплата → заказ (через orders, §11). `invoiceNumber` —
 * уникальный индекс. Авто-expire по `validUntil` при чтении/оплате.
 */
@Schema(BASE_SCHEMA_OPTIONS)
export class Invoice extends BaseSchema {
    @Prop({ type: String, required: true, unique: true, index: true })
    invoiceNumber!: string;

    @Prop({ type: String, required: true, index: true })
    chatId!: string;

    @Prop({ type: String, required: true, index: true })
    vendorId!: string;

    @Prop({ type: String, required: true, index: true })
    buyerId!: string;

    @Prop({ type: [InvoiceLineItemSchema], required: true })
    lineItems!: InvoiceLineItem[];

    @Prop({ type: InvoiceDiscountSchema, required: false })
    discount?: InvoiceDiscount;

    @Prop({ type: Number, required: true })
    subtotal!: number;

    @Prop({ type: Number, required: true })
    total!: number;

    @Prop({ type: String, required: true })
    currency!: string;

    @Prop({ type: Date, required: true })
    validUntil!: Date;

    @Prop({
        type: String,
        enum: ['draft', 'sent', 'paid', 'expired', 'cancelled'],
        default: 'draft',
    })
    status!: InvoiceStatus;

    @Prop({ type: String, required: false })
    orderId?: string;

    @Prop({ type: String, required: false })
    pdfUrl?: string;
}

export type InvoiceDocument = HydratedDocument<Invoice>;

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
