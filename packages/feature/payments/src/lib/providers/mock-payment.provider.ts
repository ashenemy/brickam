import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import type { ChargeResult } from '../../@types';
import { PaymentProvider } from './payment-provider';

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
}
