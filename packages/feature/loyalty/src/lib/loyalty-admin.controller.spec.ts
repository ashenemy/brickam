import { ForbiddenException } from '@brickam/core-kit';
import type { AuditServiceContract } from '@brickam/domain-kit';
import { Role } from '@brickam/domain-kit';
import type { AuthUser } from '@brickam/server-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LoyaltyService } from './loyalty.service';
import { LoyaltyAdminController } from './loyalty-admin.controller';

const admin: AuthUser = { id: 'a1', role: Role.Admin };
const buyer: AuthUser = { id: 'b1', role: Role.Buyer };

describe('LoyaltyAdminController', () => {
    let service: {
        listPrograms: ReturnType<typeof vi.fn>;
        createProgram: ReturnType<typeof vi.fn>;
        updateProgram: ReturnType<typeof vi.fn>;
        activateProgram: ReturnType<typeof vi.fn>;
    };
    let audit: { record: ReturnType<typeof vi.fn> };
    let controller: LoyaltyAdminController;

    beforeEach(() => {
        service = {
            listPrograms: vi.fn(),
            createProgram: vi.fn(),
            updateProgram: vi.fn(),
            activateProgram: vi.fn(),
        };
        audit = { record: vi.fn().mockResolvedValue(undefined) };
        controller = new LoyaltyAdminController(
            service as unknown as LoyaltyService,
            audit as unknown as AuditServiceContract,
        );
    });

    it('list делегирует сервису', async () => {
        const items = [{ id: 'p1' }];
        service.listPrograms.mockResolvedValue(items);
        expect(await controller.list(admin)).toBe(items);
    });

    it('create создаёт программу и пишет аудит loyalty.create', async () => {
        const dto = { basis: 'total_spend', tiers: [] };
        const created = { id: 'p1' };
        service.createProgram.mockResolvedValue(created);
        const result = await controller.create(admin, dto as never);
        expect(result).toBe(created);
        expect(service.createProgram).toHaveBeenCalledWith(dto);
        expect(audit.record).toHaveBeenCalledWith({
            actorId: 'a1',
            action: 'loyalty.create',
            targetType: 'loyalty_program',
            targetId: 'p1',
        });
    });

    it('update обновляет и пишет аудит loyalty.update', async () => {
        const dto = { tiers: [] };
        const updated = { id: 'p1' };
        service.updateProgram.mockResolvedValue(updated);
        const result = await controller.update(admin, 'p1', dto as never);
        expect(result).toBe(updated);
        expect(service.updateProgram).toHaveBeenCalledWith('p1', dto);
        expect(audit.record).toHaveBeenCalledWith(
            expect.objectContaining({ action: 'loyalty.update', targetId: 'p1' }),
        );
    });

    it('activate активирует и пишет аудит loyalty.activate', async () => {
        const activated = { id: 'p1', active: true };
        service.activateProgram.mockResolvedValue(activated);
        const result = await controller.activate(admin, 'p1');
        expect(result).toBe(activated);
        expect(service.activateProgram).toHaveBeenCalledWith('p1');
        expect(audit.record).toHaveBeenCalledWith(
            expect.objectContaining({ action: 'loyalty.activate', targetId: 'p1' }),
        );
    });

    it('не админ → Forbidden errors.admin.notAdmin', async () => {
        // list синхронно бросает в requireAdmin до возврата Promise.
        expect(() => controller.list(buyer)).toThrow(ForbiddenException);
        await expect(controller.create(buyer, {} as never)).rejects.toMatchObject({
            messageKey: 'errors.admin.notAdmin',
        });
        expect(service.listPrograms).not.toHaveBeenCalled();
        expect(service.createProgram).not.toHaveBeenCalled();
    });
});
