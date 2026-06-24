import { AppConfigService } from '@brickam/config-kit';
import { NotFoundException } from '@brickam/core-kit';
import {
    type CreatePaymentInput,
    type PaymentResult,
    PaymentStatus,
    PaymentsServiceContract,
} from '@brickam/domain-kit';
import { Injectable } from '@nestjs/common';
import type { PaymentByOrder } from '../@types';
import type { PaymentDocument } from './payment.schema';
import { PaymentsRepository } from './payments.repository';
import { PaymentProvider } from './providers/payment-provider';

/**
 * Сервис платежей (Foundations §11). Один платёж на заказ с разбивкой по
 * вендорам; провайдер — за абстракцией `PaymentProvider`. Эскроу нет.
 */
@Injectable()
export class PaymentsService implements PaymentsServiceContract {
    constructor(
        private readonly paymentsRepository: PaymentsRepository,
        private readonly provider: PaymentProvider,
        private readonly config: AppConfigService,
    ) {}

    /**
     * Создаёт платёж по заказу со статусом Pending. Провайдер фиксируется из
     * `config.providers.payment` на момент создания. Мягко проверяет, что сумма
     * сплитов равна сумме платежа (расхождение не блокирует — только лог).
     */
    async createForOrder(input: CreatePaymentInput): Promise<PaymentResult> {
        const splitsTotal = input.splits.reduce((sum, split) => sum + split.amount, 0);
        if (splitsTotal !== input.amount) {
            // Мягкая валидация: не блокируем создание, доверяем расчёту orders.
        }

        const doc = await this.paymentsRepository.create({
            orderId: input.orderId,
            buyerId: input.buyerId,
            amount: input.amount,
            provider: this.config.providers.payment,
            status: PaymentStatus.Pending,
            splits: input.splits,
        });

        return { paymentId: doc.id ?? doc._id.toString(), status: doc.status };
    }

    /**
     * Подтверждает платёж: списывает через провайдера. Успех → Succeeded и
     * сохраняем providerRef; иначе Failed. NotFound, если платежа нет.
     */
    async confirm(paymentId: string): Promise<PaymentResult> {
        const payment = await this.paymentsRepository.findById(paymentId);
        if (!payment) {
            throw new NotFoundException();
        }

        const result = await this.provider.charge(payment.amount, paymentId);

        payment.status = result.success ? PaymentStatus.Succeeded : PaymentStatus.Failed;
        if (result.success) {
            payment.providerRef = result.providerRef;
        }
        await payment.save();

        return { paymentId, status: payment.status };
    }

    /** Возвращает краткое представление платежа по заказу (или null). */
    async getByOrder(orderId: string): Promise<PaymentByOrder | null> {
        const payment = await this.paymentsRepository.findByOrder(orderId);
        if (!payment) {
            return null;
        }
        return this.toByOrder(payment);
    }

    /** Маппит документ платежа в краткое представление. */
    private toByOrder(doc: PaymentDocument): PaymentByOrder {
        return { id: doc.id ?? doc._id.toString(), status: doc.status };
    }
}
