import { ForbiddenException } from '@brickam/core-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionsController } from './subscriptions.controller';
import type { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsController', () => {
    let service: {
        getOrCreate: ReturnType<typeof vi.fn>;
        setPlan: ReturnType<typeof vi.fn>;
    };
    let controller: SubscriptionsController;

    beforeEach(() => {
        service = {
            getOrCreate: vi.fn().mockResolvedValue({ id: 's1', plan: 'free' }),
            setPlan: vi.fn().mockResolvedValue({ id: 's1', plan: 'pro' }),
        };
        controller = new SubscriptionsController(service as unknown as SubscriptionsService);
    });

    it('getMine делегирует getOrCreate с vendorId из контекста', async () => {
        await controller.getMine({ id: 'v1' });
        expect(service.getOrCreate).toHaveBeenCalledWith('v1');
    });

    it('getMine бросает Forbidden без контекста вендора', () => {
        expect(() => controller.getMine(undefined)).toThrow(ForbiddenException);
    });

    it('setPlan делегирует setPlan', async () => {
        await controller.setPlan({ id: 'v1' }, { plan: 'pro' });
        expect(service.setPlan).toHaveBeenCalledWith('v1', 'pro');
    });

    it('setPlan бросает Forbidden без контекста вендора', () => {
        expect(() => controller.setPlan(undefined, { plan: 'pro' })).toThrow(ForbiddenException);
    });
});
