import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoyaltyController } from './loyalty.controller';
import type { LoyaltyService } from './loyalty.service';

describe('LoyaltyController', () => {
    let service: {
        getStatus: ReturnType<typeof vi.fn>;
        getActiveProgram: ReturnType<typeof vi.fn>;
    };
    let controller: LoyaltyController;

    beforeEach(() => {
        service = {
            getStatus: vi.fn().mockResolvedValue({ metric: {}, basis: 'total_spend' }),
            getActiveProgram: vi.fn().mockResolvedValue({ basis: 'total_spend', tiers: [] }),
        };
        controller = new LoyaltyController(service as unknown as LoyaltyService);
    });

    it('getMe делегирует getStatus с buyerId', async () => {
        await controller.getMe('b1');
        expect(service.getStatus).toHaveBeenCalledWith('b1');
    });

    it('getProgram делегирует getActiveProgram', async () => {
        await controller.getProgram();
        expect(service.getActiveProgram).toHaveBeenCalledTimes(1);
    });
});
