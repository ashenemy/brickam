import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import type { ChargeResult, RefundResult, WebhookEvent } from '../../@types';
import { PaymentProvider } from './payment-provider';

/** Ожидаемая форма payload mock-вебхука. */
type MockWebhookPayload = {
    ref?: unknown;
    orderId?: unknown;
    status?: unknown;
};

/**
 * Mock-реализация провайдера платежей. Ничего не списывает реально — пишет в лог
 * и всегда возвращает успех, чтобы работать в dev/тестах без интеграции
 * (Foundations §11/§16).
 */
@Injectable()
export class MockPaymentProvider extends PaymentProvider {
    override name = 'mock';

    private readonly logger = new Logger('Payment');

    override async charge(amount: number, ref: string): Promise<ChargeResult> {
        const providerRef = `mock_${randomUUID()}`;
        this.logger.log(`Charge ${amount} AMD | ref=${ref} | providerRef=${providerRef}`);
        return { providerRef, success: true };
    }

    /**
     * Разбирает mock-вебхук вида `{ ref, status, orderId? }`. Подпись в mock
     * тривиальна: `undefined` (dev — без проверки) либо `'mock'`; иначе —
     * невалидна. Структура verify сохранена под реального провайдера.
     */
    override parseWebhook(payload: unknown, signature?: string): WebhookEvent | null {
        if (!this.verifySignature(signature)) {
            return null;
        }
        if (typeof payload !== 'object' || payload === null) {
            return null;
        }
        const { ref, orderId, status } = payload as MockWebhookPayload;
        if (typeof ref !== 'string' || ref.length === 0) {
            return null;
        }
        if (typeof status !== 'string') {
            return null;
        }
        const event: WebhookEvent = { providerRef: ref, success: status === 'succeeded' };
        if (typeof orderId === 'string') {
            event.orderId = orderId;
        }
        return event;
    }

    /** Детерминированный возврат: refundRef выводится из providerRef. */
    override async refund(providerRef: string, amount: number): Promise<RefundResult> {
        const refundRef = `mock_refund_${providerRef}`;
        this.logger.log(
            `Refund ${amount} AMD | providerRef=${providerRef} | refundRef=${refundRef}`,
        );
        return { success: true, refundRef };
    }

    /**
     * Верификация подписи (в mock — тривиальная). Реальный провайдер сверяет
     * HMAC payload с секретом; здесь принимаем dev-режим (без подписи) или
     * фиксированное значение `'mock'`.
     */
    private verifySignature(signature?: string): boolean {
        return signature === undefined || signature === 'mock';
    }
}
