import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import { PaymentStatus, type VendorSplit } from '@brickam/domain-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

/**
 * Под-схема сплита платежа по вендору (Foundations §11). Сумма всех `amount`
 * равна сумме платежа; комиссия платформы и выплата вендору — справочно.
 */
@Schema({ _id: false })
class PaymentSplit implements VendorSplit {
    @Prop({ type: String, required: true })
    vendorId!: string;

    @Prop({ type: Number, required: true })
    amount!: number;

    @Prop({ type: Number, required: true })
    commissionAmount!: number;

    @Prop({ type: Number, required: true })
    payoutAmount!: number;
}

const PaymentSplitSchema = SchemaFactory.createForClass(PaymentSplit);

/**
 * Платёж по заказу (Foundations §11/§15). Один платёж на заказ с разбивкой по
 * вендорам (`splits`). Эскроу нет — оплата обычным списанием через провайдера.
 */
@Schema(BASE_SCHEMA_OPTIONS)
export class Payment extends BaseSchema {
    @Prop({ type: String, required: true, index: true })
    orderId!: string;

    @Prop({ type: String, required: true })
    buyerId!: string;

    /** Сумма платежа в AMD (целые). */
    @Prop({ type: Number, required: true })
    amount!: number;

    /** Имя провайдера (mock|idram|telcell|arca) из конфига на момент создания. */
    @Prop({ type: String, required: true })
    provider!: string;

    /** Идентификатор транзакции у провайдера (появляется после списания). */
    @Prop({ type: String, required: false, index: true })
    providerRef?: string;

    /** Идентификатор возврата у провайдера (появляется после refund). */
    @Prop({ type: String, required: false })
    refundRef?: string;

    @Prop({
        type: String,
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.Pending,
    })
    status!: PaymentStatus;

    @Prop({ type: [PaymentSplitSchema], default: [] })
    splits!: VendorSplit[];
}

export type PaymentDocument = HydratedDocument<Payment>;

export const PaymentSchema = SchemaFactory.createForClass(Payment);
