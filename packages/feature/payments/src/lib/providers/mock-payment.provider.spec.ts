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
});
