import { describe, expect, it } from 'vitest';
import { MockPaymentProvider } from './mock-payment.provider';

describe('MockPaymentProvider', () => {
    it('charge возвращает success:true и providerRef с префиксом mock_', async () => {
        const provider = new MockPaymentProvider();

        const result = await provider.charge(1000, 'p1');

        expect(result.success).toBe(true);
        expect(result.providerRef).toMatch(/^mock_/);
    });

    it('имеет имя mock', () => {
        expect(new MockPaymentProvider().name).toBe('mock');
    });

    describe('parseWebhook', () => {
        it('разбирает валидный успешный вебхук (success:true)', () => {
            const event = new MockPaymentProvider().parseWebhook({
                ref: 'mock_1',
                orderId: 'o1',
                status: 'succeeded',
            });

            expect(event).toEqual({ providerRef: 'mock_1', orderId: 'o1', success: true });
        });

        it('помечает неуспех при status !== succeeded', () => {
            const event = new MockPaymentProvider().parseWebhook({
                ref: 'mock_1',
                status: 'failed',
            });

            expect(event).toEqual({ providerRef: 'mock_1', orderId: undefined, success: false });
        });

        it('принимает корректную подпись mock', () => {
            const event = new MockPaymentProvider().parseWebhook(
                { ref: 'mock_1', status: 'succeeded' },
                'mock',
            );

            expect(event?.success).toBe(true);
        });

        it('возвращает null при неверной подписи', () => {
            const event = new MockPaymentProvider().parseWebhook(
                { ref: 'mock_1', status: 'succeeded' },
                'wrong',
            );

            expect(event).toBeNull();
        });

        it('возвращает null для нераспознанного payload', () => {
            const provider = new MockPaymentProvider();

            expect(provider.parseWebhook(null)).toBeNull();
            expect(provider.parseWebhook('text')).toBeNull();
            expect(provider.parseWebhook({ status: 'succeeded' })).toBeNull();
            expect(provider.parseWebhook({ ref: 'mock_1' })).toBeNull();
        });
    });

    describe('refund', () => {
        it('возвращает success:true и детерминированный refundRef от providerRef', async () => {
            const provider = new MockPaymentProvider();

            const a = await provider.refund('mock_abc', 1000);
            const b = await provider.refund('mock_abc', 1000);

            expect(a.success).toBe(true);
            expect(a.refundRef).toBe('mock_refund_mock_abc');
            expect(b.refundRef).toBe(a.refundRef);
        });
    });
});
