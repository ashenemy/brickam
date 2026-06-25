import { ForbiddenException } from '@brickam/core-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VendorsController } from './vendors.controller';
import type { VendorsService } from './vendors.service';

describe('VendorsController', () => {
    let service: {
        getById: ReturnType<typeof vi.fn>;
        getBySlug: ReturnType<typeof vi.fn>;
        getMine: ReturnType<typeof vi.fn>;
        updateProfile: ReturnType<typeof vi.fn>;
    };
    let controller: VendorsController;

    beforeEach(() => {
        service = {
            getById: vi.fn().mockResolvedValue({ id: 'v1' }),
            getBySlug: vi.fn().mockResolvedValue({ id: 'v1' }),
            getMine: vi.fn().mockResolvedValue({ id: 'v1' }),
            updateProfile: vi.fn().mockResolvedValue({ id: 'v1' }),
        };
        controller = new VendorsController(service as unknown as VendorsService);
    });

    it('getProfile по ObjectId зовёт getById', async () => {
        await controller.getProfile('507f1f77bcf86cd799439011');
        expect(service.getById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
        expect(service.getBySlug).not.toHaveBeenCalled();
    });

    it('getProfile по slug зовёт getBySlug', async () => {
        await controller.getProfile('acme');
        expect(service.getBySlug).toHaveBeenCalledWith('acme');
    });

    it('getMine делегирует сервису с vendorId из контекста', async () => {
        await controller.getMine({ id: 'v1' });
        expect(service.getMine).toHaveBeenCalledWith('v1');
    });

    it('getMine бросает Forbidden без контекста вендора', () => {
        expect(() => controller.getMine(undefined)).toThrow(ForbiddenException);
    });

    it('updateMine делегирует updateProfile', async () => {
        await controller.updateMine({ id: 'v1' }, { name: 'New' });
        expect(service.updateProfile).toHaveBeenCalledWith('v1', { name: 'New' });
    });

    it('updateMine бросает Forbidden без контекста вендора', () => {
        expect(() => controller.updateMine(undefined, { name: 'New' })).toThrow(ForbiddenException);
    });
});
