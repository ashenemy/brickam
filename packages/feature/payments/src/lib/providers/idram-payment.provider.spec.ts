import { describe, expect, it } from 'vitest';
import { IdramPaymentProvider } from './idram-payment.provider';

const cfg = {
    gatewayUrl: 'https://banking.idram.am/Payment/GetPayment',
    recAccount: '110000001',
    secretKey: 'secretkey',
};

const provider = new IdramPaymentProvider(cfg);

// MD5(110000001:1000:p1:secretkey:T123:PAYER9).toUpperCase()
const VALID_CHECKSUM = '281646472EB45593454D8355E4F55C82';

describe('IdramPaymentProvider', () => {
    describe('initiate', () => {
        it('собирает redirect-URL с нужными EDP_* и providerRef=ref', async () => {
            const result = await provider.initiate({
                amount: 1000,
                orderId: 'o1',
                ref: 'p1',
                returnUrl: 'unused',
            });

            expect(result?.providerRef).toBe('p1');
            const url = new URL(result?.redirectUrl ?? '');
            expect(url.origin + url.pathname).toBe('https://banking.idram.am/Payment/GetPayment');
            expect(url.searchParams.get('EDP_LANGUAGE')).toBe('AM');
            expect(url.searchParams.get('EDP_REC_ACCOUNT')).toBe('110000001');
            expect(url.searchParams.get('EDP_DESCRIPTION')).toBe('o1');
            expect(url.searchParams.get('EDP_AMOUNT')).toBe('1000');
            expect(url.searchParams.get('EDP_BILL_NO')).toBe('p1');
        });
    });

    describe('parseWebhook', () => {
        it('прехек EDP_PRECHECK=YES → маркер precheck', () => {
            const event = provider.parseWebhook({ EDP_PRECHECK: 'YES', EDP_BILL_NO: 'p1' });
            expect(event).toEqual({ providerRef: 'p1', success: false, precheck: true });
        });

        it('валидный checksum → success', () => {
            const event = provider.parseWebhook({
                EDP_REC_ACCOUNT: '110000001',
                EDP_AMOUNT: '1000',
                EDP_BILL_NO: 'p1',
                EDP_TRANS_ID: 'T123',
                EDP_PAYER_ACCOUNT: 'PAYER9',
                EDP_CHECKSUM: VALID_CHECKSUM,
            });
            expect(event).toEqual({ providerRef: 'p1', success: true });
        });

        it('неверный checksum → null', () => {
            const event = provider.parseWebhook({
                EDP_REC_ACCOUNT: '110000001',
                EDP_AMOUNT: '1000',
                EDP_BILL_NO: 'p1',
                EDP_TRANS_ID: 'T123',
                EDP_PAYER_ACCOUNT: 'PAYER9',
                EDP_CHECKSUM: 'WRONG',
            });
            expect(event).toBeNull();
        });

        it('payload не объект → null', () => {
            expect(provider.parseWebhook(null)).toBeNull();
        });
    });

    it('refund → success false (ручной возврат)', async () => {
        await expect(provider.refund('p1', 1000)).resolves.toEqual({ success: false });
    });

    it('charge → throw (redirect-only)', async () => {
        await expect(provider.charge(1000, 'p1')).rejects.toThrow();
    });
});
