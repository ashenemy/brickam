import { AppConfigService } from '@brickam/config-kit';
import { NotFoundException, ValidationException } from '@brickam/core-kit';
import {
    type CreatePaymentInput,
    type PaymentResult,
    PaymentStatus,
    PaymentsServiceContract,
    type TxSession,
} from '@brickam/domain-kit';
import { Injectable } from '@nestjs/common';
import type { ClientSession } from 'mongoose';
import type { PaymentByOrder } from '../@types';
import type { PaymentDocument } from './payment.schema';
import { PaymentsRepository } from './payments.repository';
import { PaymentProvider } from './providers/payment-provider';

/**
 * Результат обработки вебхука. Для Idram-прехека — маркер `{ precheck: true }`
 * (контроллер отвечает `OK` без подтверждения оплаты); иначе — обычный PaymentResult.
 */
export type WebhookResult = PaymentResult | { precheck: true };

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
    async createForOrder(input: CreatePaymentInput, session?: TxSession): Promise<PaymentResult> {
        const splitsTotal = input.splits.reduce((sum, split) => sum + split.amount, 0);
        if (splitsTotal !== input.amount) {
            // Мягкая валидация: не блокируем создание, доверяем расчёту orders.
        }

        const doc = await this.paymentsRepository.create(
            {
                orderId: input.orderId,
                buyerId: input.buyerId,
                amount: input.amount,
                provider: this.config.providers.payment,
                status: PaymentStatus.Pending,
                splits: input.splits,
            },
            session as ClientSession | undefined,
        );

        const paymentId = doc.id ?? doc._id.toString();

        // Redirect-флоу (карты ArCa/Idram): регистрируем платёж у PSP и возвращаем
        // URL платёжной страницы. `ref` — наш paymentId, по нему сопоставляем
        // callback. `returnUrl` — серверный callback ArCa (Idram шлёт свой push).
        const initiated = await this.provider.initiate({
            amount: input.amount,
            orderId: input.orderId,
            ref: paymentId,
            returnUrl: `${this.siteUrl()}/api/payments/arca/callback`,
        });

        if (initiated) {
            doc.providerRef = initiated.providerRef;
            await doc.save();
            return { paymentId, status: doc.status, redirectUrl: initiated.redirectUrl };
        }

        // Синхронный провайдер (mock): прежнее поведение — оплата через confirm.
        return { paymentId, status: doc.status };
    }

    /** Базовый URL сайта для returnUrl/redirect назад на фронт (из окружения). */
    private siteUrl(): string {
        return process.env['SITE_URL'] ?? 'http://localhost:3000';
    }

    /**
     * Обрабатывает возврат покупателя с платёжной страницы ArCa: находит платёж по
     * `providerRef` (arca orderId), тянет статус через провайдера и при успехе
     * переводит в Succeeded (идемпотентно). Возвращает наш `orderId` для редиректа
     * фронта на /orders/:id. NotFound, если платёж по providerRef не найден.
     */
    async handleArcaReturn(arcaOrderId: string): Promise<{ orderId: string }> {
        const payment = await this.paymentsRepository.findByProviderRef(arcaOrderId);
        if (!payment) {
            throw new NotFoundException();
        }

        if (payment.status !== PaymentStatus.Succeeded) {
            const status = await this.provider.getStatus(arcaOrderId);
            if (status?.success) {
                payment.status = PaymentStatus.Succeeded;
                await payment.save();
            }
        }

        return { orderId: payment.orderId };
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

    /**
     * Обрабатывает асинхронный вебхук провайдера (Foundations §11). Провайдер
     * сам подтверждает оплату — мы парсим/верифицируем payload, находим платёж
     * по `providerRef` (или `orderId`) и при успехе переводим в Succeeded.
     * Idram-прехек (`precheck`) не подтверждает оплату — возвращаем маркер
     * `{ precheck: true }`, контроллер отвечает `OK`. Идемпотентно: повторный
     * вебхук на уже Succeeded-платёж не меняет статус и не падает.
     * Невалидный/неверифицированный payload → ValidationException.
     */
    async handleWebhook(payload: unknown, signature?: string): Promise<WebhookResult> {
        const event = this.provider.parseWebhook(payload, signature);
        if (!event) {
            throw new ValidationException('errors.payments.invalidWebhook');
        }

        // Idram-прехек: подтверждаем готовность принять платёж, оплату не меняем.
        if (event.precheck) {
            return { precheck: true };
        }

        const payment =
            (await this.paymentsRepository.findByProviderRef(event.providerRef)) ??
            (event.orderId ? await this.paymentsRepository.findByOrder(event.orderId) : null);
        if (!payment) {
            throw new NotFoundException();
        }

        const paymentId = payment.id ?? payment._id.toString();

        // Идемпотентность: уже подтверждённый платёж возвращаем как есть.
        if (payment.status === PaymentStatus.Succeeded) {
            return { paymentId, status: payment.status };
        }

        if (event.success) {
            payment.status = PaymentStatus.Succeeded;
            payment.providerRef = event.providerRef;
            await payment.save();
        }

        return { paymentId, status: payment.status };
    }

    /**
     * Возврат средств по платежу. Возможен только для Succeeded; провайдер
     * выполняет refund, после чего платёж переводится в Refunded и сохраняется
     * `refundRef`. NotFound, если платежа нет; ValidationException, если платёж
     * не в статусе Succeeded.
     */
    async refund(paymentId: string): Promise<PaymentResult> {
        const payment = await this.paymentsRepository.findById(paymentId);
        if (!payment) {
            throw new NotFoundException();
        }
        if (payment.status !== PaymentStatus.Succeeded || !payment.providerRef) {
            throw new ValidationException('errors.payments.notRefundable');
        }

        const result = await this.provider.refund(payment.providerRef, payment.amount);
        if (result.success) {
            payment.status = PaymentStatus.Refunded;
            if (result.refundRef) {
                payment.refundRef = result.refundRef;
            }
            await payment.save();
        }

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
