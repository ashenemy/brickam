import { PaymentStatus } from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentsController } from './payments.controller';
import type { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
    let service: {
        handleWebhook: ReturnType<typeof vi.fn>;
        refund: ReturnType<typeof vi.fn>;
        handleArcaReturn: ReturnType<typeof vi.fn>;
    };
    let controller: PaymentsController;

    const makeRes = () => {
        const res = {
            redirect: vi.fn(),
            type: vi.fn(),
            status: vi.fn(),
            send: vi.fn(),
        };
        res.type.mockReturnValue(res);
        res.status.mockReturnValue(res);
        return res;
    };

    beforeEach(() => {
        service = { handleWebhook: vi.fn(), refund: vi.fn(), handleArcaReturn: vi.fn() };
        controller = new PaymentsController(service as unknown as PaymentsService);
    });

    it('handleWebhook делегирует payload и подпись в сервис', async () => {
        service.handleWebhook.mockResolvedValue({
            paymentId: 'p1',
            status: PaymentStatus.Succeeded,
        });
        const payload = { ref: 'mock_ref', status: 'succeeded' };

        const result = await controller.handleWebhook(payload, 'mock');

        expect(service.handleWebhook).toHaveBeenCalledWith(payload, 'mock');
        expect(result).toEqual({ paymentId: 'p1', status: PaymentStatus.Succeeded });
    });

    it('refund делегирует id в сервис', async () => {
        service.refund.mockResolvedValue({ paymentId: 'p1', status: PaymentStatus.Refunded });

        const result = await controller.refund('p1');

        expect(service.refund).toHaveBeenCalledWith('p1');
        expect(result.status).toBe(PaymentStatus.Refunded);
    });

    it('arcaCallback: handleArcaReturn → 302 редирект на /orders/:id', async () => {
        service.handleArcaReturn.mockResolvedValue({ orderId: 'o1' });
        const res = makeRes();

        await controller.arcaCallback('arca-1', res as never);

        expect(service.handleArcaReturn).toHaveBeenCalledWith('arca-1');
        expect(res.redirect).toHaveBeenCalledWith(302, expect.stringContaining('/orders/o1'));
    });

    it('idramCallback precheck → text/plain OK', async () => {
        service.handleWebhook.mockResolvedValue({ precheck: true });
        const res = makeRes();

        await controller.idramCallback({ EDP_PRECHECK: 'YES' }, res as never);

        expect(res.type).toHaveBeenCalledWith('text/plain');
        expect(res.send).toHaveBeenCalledWith('OK');
    });

    it('idramCallback валидный результат → confirm + OK', async () => {
        service.handleWebhook.mockResolvedValue({
            paymentId: 'p1',
            status: PaymentStatus.Succeeded,
        });
        const res = makeRes();

        await controller.idramCallback({ EDP_CHECKSUM: 'X' }, res as never);

        expect(res.send).toHaveBeenCalledWith('OK');
    });

    it('idramCallback невалидный → 400 ERROR', async () => {
        service.handleWebhook.mockRejectedValue(new Error('invalid'));
        const res = makeRes();

        await controller.idramCallback({}, res as never);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith('ERROR');
    });
});
