import { ForbiddenException } from '@brickam/core-kit';
import { type AuditServiceContract, Role } from '@brickam/domain-kit';
import type { AuthUser } from '@brickam/server-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VendorsService } from './vendors.service';
import { VendorsAdminController } from './vendors-admin.controller';

const admin: AuthUser = { id: 'a1', role: Role.Admin };
const buyer: AuthUser = { id: 'u1', role: Role.Buyer };

describe('VendorsAdminController', () => {
    let vendorsService: {
        list: ReturnType<typeof vi.fn>;
        setStatus: ReturnType<typeof vi.fn>;
    };
    let audit: { record: ReturnType<typeof vi.fn> };
    let controller: VendorsAdminController;

    beforeEach(() => {
        vendorsService = {
            list: vi.fn().mockResolvedValue([{ id: 'v1' }]),
            setStatus: vi.fn().mockResolvedValue({ id: 'v1', status: 'active' }),
        };
        audit = { record: vi.fn().mockResolvedValue(undefined) };
        controller = new VendorsAdminController(
            vendorsService as unknown as VendorsService,
            audit as unknown as AuditServiceContract,
        );
    });

    describe('admin-гейт', () => {
        it('не админ → Forbidden (list)', async () => {
            await expect(controller.list(buyer, {})).rejects.toBeInstanceOf(ForbiddenException);
        });

        it('без пользователя → Forbidden (moderate)', async () => {
            await expect(
                controller.moderate(undefined, 'v1', { action: 'approve' }),
            ).rejects.toBeInstanceOf(ForbiddenException);
        });
    });

    describe('list', () => {
        it('делегирует сервису со статусом из query', async () => {
            await controller.list(admin, { status: 'suspended' });
            expect(vendorsService.list).toHaveBeenCalledWith('suspended');
        });

        it('без статуса → list(undefined)', async () => {
            await controller.list(admin, {});
            expect(vendorsService.list).toHaveBeenCalledWith(undefined);
        });
    });

    describe('moderate', () => {
        it('approve → active + аудит', async () => {
            await controller.moderate(admin, 'v1', { action: 'approve' });
            expect(vendorsService.setStatus).toHaveBeenCalledWith('v1', 'active');
            expect(audit.record).toHaveBeenCalledWith({
                actorId: 'a1',
                action: 'vendor.moderate',
                targetType: 'vendor',
                targetId: 'v1',
                meta: { action: 'approve' },
            });
        });

        it('reject → suspended', async () => {
            await controller.moderate(admin, 'v2', { action: 'reject' });
            expect(vendorsService.setStatus).toHaveBeenCalledWith('v2', 'suspended');
            expect(audit.record).toHaveBeenCalledWith(
                expect.objectContaining({ meta: { action: 'reject' } }),
            );
        });
    });
});
