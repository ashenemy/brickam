import type { AppConfigService } from '@brickam/config-kit';
import { NotFoundException } from '@brickam/core-kit';
import { PaymentStatus, type VendorSplit } from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';
import type { PaymentProvider } from './providers/payment-provider';

const splits: VendorSplit[] = [
    { vendorId: 'v1', amount: 600, commissionAmount: 60, payoutAmount: 540 },
    { vendorId: 'v2', amount: 400, commissionAmount: 40, payoutAmount: 360 },
];

const makeDoc = (over: Record<string, unknown> = {}) => ({
    id: 'p1',
    _id: { toString: () => 'p1' },
    orderId: 'o1',
    buyerId: 'b1',
    amount: 1000,
    provider: 'mock',
    status: PaymentStatus.Pending,
    splits,
    save: vi.fn().mockResolvedValue(undefined),
    ...over,
});

describe('PaymentsService', () => {
    let repo: {
        create: ReturnType<typeof vi.fn>;
        findById: ReturnType<typeof vi.fn>;
        findByOrder: ReturnType<typeof vi.fn>;
    };
    let provider: { name: string; charge: ReturnType<typeof vi.fn> };
    let config: { providers: { payment: string } };
    let service: PaymentsService;

    beforeEach(() => {
        repo = { create: vi.fn(), findById: vi.fn(), findByOrder: vi.fn() };
        provider = { name: 'mock', charge: vi.fn() };
        config = { providers: { payment: 'mock' } };
        service = new PaymentsService(
            repo as unknown as PaymentsRepository,
            provider as unknown as PaymentProvider,
            config as unknown as AppConfigService,
        );
    });

    describe('createForOrder', () => {
        it('создаёт платёж со статусом Pending, провайдером из конфига и splits', async () => {
            repo.create.mockResolvedValue(makeDoc());

            const result = await service.createForOrder({
                orderId: 'o1',
                buyerId: 'b1',
                amount: 1000,
                splits,
            });

            expect(repo.create).toHaveBeenCalledWith(
                {
                    orderId: 'o1',
                    buyerId: 'b1',
                    amount: 1000,
                    provider: 'mock',
                    status: PaymentStatus.Pending,
                    splits,
                },
                undefined,
            );
            expect(result).toEqual({ paymentId: 'p1', status: PaymentStatus.Pending });
        });

        it('не блокирует при расхождении суммы splits и amount', async () => {
            repo.create.mockResolvedValue(makeDoc());

            const result = await service.createForOrder({
                orderId: 'o1',
                buyerId: 'b1',
                amount: 9999,
                splits,
            });

            expect(repo.create).toHaveBeenCalled();
            expect(result.status).toBe(PaymentStatus.Pending);
        });
    });

    describe('confirm', () => {
        it('вызывает provider.charge и при успехе ставит Succeeded + providerRef', async () => {
            const doc = makeDoc();
            repo.findById.mockResolvedValue(doc);
            provider.charge.mockResolvedValue({ providerRef: 'mock_abc', success: true });

            const result = await service.confirm('p1');

            expect(provider.charge).toHaveBeenCalledWith(1000, 'p1');
            expect(doc.status).toBe(PaymentStatus.Succeeded);
            expect(doc.providerRef).toBe('mock_abc');
            expect(doc.save).toHaveBeenCalled();
            expect(result).toEqual({ paymentId: 'p1', status: PaymentStatus.Succeeded });
        });

        it('при неуспехе провайдера ставит Failed без providerRef', async () => {
            const doc = makeDoc();
            repo.findById.mockResolvedValue(doc);
            provider.charge.mockResolvedValue({ providerRef: 'mock_x', success: false });

            const result = await service.confirm('p1');

            expect(doc.status).toBe(PaymentStatus.Failed);
            expect(doc.providerRef).toBeUndefined();
            expect(result.status).toBe(PaymentStatus.Failed);
        });

        it('бросает NotFound, если платежа нет', async () => {
            repo.findById.mockResolvedValue(null);

            await expect(service.confirm('missing')).rejects.toBeInstanceOf(NotFoundException);
            expect(provider.charge).not.toHaveBeenCalled();
        });
    });

    describe('getByOrder', () => {
        it('маппит документ в { id, status }', async () => {
            repo.findByOrder.mockResolvedValue(makeDoc({ status: PaymentStatus.Succeeded }));

            const result = await service.getByOrder('o1');

            expect(repo.findByOrder).toHaveBeenCalledWith('o1');
            expect(result).toEqual({ id: 'p1', status: PaymentStatus.Succeeded });
        });

        it('возвращает null, если платежа по заказу нет', async () => {
            repo.findByOrder.mockResolvedValue(null);

            const result = await service.getByOrder('none');

            expect(result).toBeNull();
        });
    });
});
