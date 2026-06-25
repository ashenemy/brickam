import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SubscriptionsRepository } from './subscriptions.repository';
import { SubscriptionsService } from './subscriptions.service';

const makeDoc = (over: Record<string, unknown> = {}) => ({
    id: 's1',
    _id: { toString: () => 's1' },
    vendorId: 'v1',
    plan: 'free',
    since: new Date('2026-06-01'),
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-01'),
    ...over,
});

describe('SubscriptionsService', () => {
    let repo: {
        findByVendor: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        updateById: ReturnType<typeof vi.fn>;
    };
    let service: SubscriptionsService;

    beforeEach(() => {
        repo = {
            findByVendor: vi.fn(),
            create: vi.fn(),
            updateById: vi.fn(),
        };
        service = new SubscriptionsService(repo as unknown as SubscriptionsRepository);
    });

    describe('getOrCreate', () => {
        it('возвращает существующую подписку', async () => {
            repo.findByVendor.mockResolvedValue(makeDoc({ plan: 'pro' }));
            const sub = await service.getOrCreate('v1');
            expect(repo.create).not.toHaveBeenCalled();
            expect(sub.plan).toBe('pro');
        });

        it('создаёт free-подписку по умолчанию, если её нет', async () => {
            repo.findByVendor.mockResolvedValue(null);
            repo.create.mockResolvedValue(makeDoc());
            const sub = await service.getOrCreate('v1');
            expect(repo.create).toHaveBeenCalledWith(
                expect.objectContaining({ vendorId: 'v1', plan: 'free' }),
            );
            expect(sub.plan).toBe('free');
        });
    });

    describe('setPlan', () => {
        it('меняет план существующей подписки', async () => {
            repo.findByVendor.mockResolvedValue(makeDoc({ plan: 'free' }));
            repo.updateById.mockResolvedValue(makeDoc({ plan: 'pro' }));
            const sub = await service.setPlan('v1', 'pro');
            expect(repo.updateById).toHaveBeenCalledWith(
                's1',
                expect.objectContaining({ plan: 'pro' }),
            );
            expect(sub.plan).toBe('pro');
        });

        it('создаёт подписку с заданным планом, если её ещё нет', async () => {
            repo.findByVendor.mockResolvedValue(null);
            repo.create.mockResolvedValue(makeDoc({ plan: 'pro' }));
            const sub = await service.setPlan('v1', 'pro');
            expect(repo.create).toHaveBeenCalledWith(
                expect.objectContaining({ vendorId: 'v1', plan: 'pro' }),
            );
            expect(sub.plan).toBe('pro');
        });
    });
});
