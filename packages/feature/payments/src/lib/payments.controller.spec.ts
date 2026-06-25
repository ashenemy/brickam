import { PaymentStatus } from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentsController } from './payments.controller';
import type { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
    let service: { handleWebhook: ReturnType<typeof vi.fn>; refund: ReturnType<typeof vi.fn> };
    let controller: PaymentsController;

    beforeEach(() => {
        service = { handleWebhook: vi.fn(), refund: vi.fn() };
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
});
