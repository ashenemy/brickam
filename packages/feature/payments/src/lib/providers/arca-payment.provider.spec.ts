import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ArcaPaymentProvider } from './arca-payment.provider';

const cfg = {
    gatewayUrl: 'https://arca.test/payment/rest',
    username: 'merchant',
    password: 'secret',
};

const jsonResponse = (body: unknown): Response =>
    ({ json: () => Promise.resolve(body) }) as unknown as Response;

describe('ArcaPaymentProvider', () => {
    let provider: ArcaPaymentProvider;
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        provider = new ArcaPaymentProvider(cfg);
        fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('initiate', () => {
        it('POST registerOrder.do с суммой в минорных единицах → formUrl/orderId', async () => {
            fetchMock.mockResolvedValue(
                jsonResponse({
                    orderId: 'arca-1',
                    formUrl: 'https://arca.test/pay/arca-1',
                    errorCode: '0',
                }),
            );

            const result = await provider.initiate({
                amount: 1000,
                orderId: 'o1',
                ref: 'p1',
                returnUrl: 'https://site.test/api/payments/arca/callback',
            });

            expect(result).toEqual({
                redirectUrl: 'https://arca.test/pay/arca-1',
                providerRef: 'arca-1',
            });
            const [url, init] = fetchMock.mock.calls[0];
            expect(url).toBe('https://arca.test/payment/rest/registerOrder.do');
            expect(init.method).toBe('POST');
            const body = new URLSearchParams(init.body as URLSearchParams);
            expect(body.get('userName')).toBe('merchant');
            expect(body.get('orderNumber')).toBe('p1');
            expect(body.get('amount')).toBe('100000');
            expect(body.get('currency')).toBe('051');
            expect(body.get('returnUrl')).toBe('https://site.test/api/payments/arca/callback');
        });

        it('errorCode !== 0 → throw', async () => {
            fetchMock.mockResolvedValue(jsonResponse({ errorCode: '5', errorMessage: 'bad' }));

            await expect(
                provider.initiate({ amount: 1000, orderId: 'o1', ref: 'p1', returnUrl: 'u' }),
            ).rejects.toThrow(/registerOrder failed/);
        });
    });

    describe('getStatus', () => {
        it('OrderStatus=2 → success true', async () => {
            fetchMock.mockResolvedValue(jsonResponse({ OrderStatus: 2 }));
            await expect(provider.getStatus('arca-1')).resolves.toEqual({ success: true });
        });

        it('OrderStatus!=2 → success false', async () => {
            fetchMock.mockResolvedValue(jsonResponse({ orderStatus: 0 }));
            await expect(provider.getStatus('arca-1')).resolves.toEqual({ success: false });
        });
    });

    describe('refund', () => {
        it('errorCode=0 → success + refundRef', async () => {
            fetchMock.mockResolvedValue(jsonResponse({ errorCode: '0' }));
            const result = await provider.refund('arca-1', 1000);
            expect(result.success).toBe(true);
            expect(result.refundRef).toBe('arca_refund_arca-1');
            const body = new URLSearchParams(fetchMock.mock.calls[0][1].body as URLSearchParams);
            expect(body.get('amount')).toBe('100000');
        });

        it('errorCode!=0 → success false', async () => {
            fetchMock.mockResolvedValue(jsonResponse({ errorCode: '7' }));
            await expect(provider.refund('arca-1', 1000)).resolves.toEqual({ success: false });
        });
    });

    it('parseWebhook → null (ArCa не шлёт push)', () => {
        expect(provider.parseWebhook({})).toBeNull();
    });

    it('charge → throw (redirect-only)', async () => {
        await expect(provider.charge(1000, 'p1')).rejects.toThrow();
    });
});
