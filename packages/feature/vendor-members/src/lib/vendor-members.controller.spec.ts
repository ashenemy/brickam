import { ForbiddenException } from '@brickam/core-kit';
import { Role } from '@brickam/domain-kit';
import type { AuthUser, VendorContext } from '@brickam/server-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VendorMembersController } from './vendor-members.controller';
import type { VendorMembersService } from './vendor-members.service';

const owner: AuthUser = { id: 'u1', role: Role.VendorOwner, vendorId: 'v1' };
const vendor: VendorContext = { id: 'v1' };

describe('VendorMembersController', () => {
    let service: {
        listMembers: ReturnType<typeof vi.fn>;
        addMember: ReturnType<typeof vi.fn>;
        updateMember: ReturnType<typeof vi.fn>;
        removeMember: ReturnType<typeof vi.fn>;
    };
    let controller: VendorMembersController;

    beforeEach(() => {
        service = {
            listMembers: vi.fn().mockResolvedValue([]),
            addMember: vi.fn().mockResolvedValue({ id: 'm1' }),
            updateMember: vi.fn().mockResolvedValue({ id: 'm1' }),
            removeMember: vi.fn().mockResolvedValue(undefined),
        };
        controller = new VendorMembersController(service as unknown as VendorMembersService);
    });

    it('list: владелец получает команду своего вендора', async () => {
        await controller.list(owner, vendor);
        expect(service.listMembers).toHaveBeenCalledWith('v1');
    });

    it('add: владелец добавляет суб-аккаунт', async () => {
        await controller.add(owner, vendor, { phone: '+374', permissions: ['orders.view'] });
        expect(service.addMember).toHaveBeenCalledWith('v1', '+374', ['orders.view']);
    });

    it('update: владелец меняет права', async () => {
        await controller.update(owner, vendor, 'u2', { permissions: ['chat.handle'] });
        expect(service.updateMember).toHaveBeenCalledWith('v1', 'u2', ['chat.handle']);
    });

    it('remove: владелец удаляет суб-аккаунт', async () => {
        await controller.remove(owner, vendor, 'u2');
        expect(service.removeMember).toHaveBeenCalledWith('v1', 'u2');
    });

    it('не владелец (роль member) → Forbidden', () => {
        const member: AuthUser = { id: 'u9', role: Role.VendorMember, vendorId: 'v1' };
        expect(() => controller.list(member, vendor)).toThrow(ForbiddenException);
    });

    it('владелец чужого вендора (vendorId != контекст) → Forbidden', () => {
        const other: AuthUser = { id: 'u8', role: Role.VendorOwner, vendorId: 'v2' };
        expect(() => controller.list(other, vendor)).toThrow(ForbiddenException);
    });

    it('без пользователя/вендора → Forbidden', () => {
        expect(() => controller.list(undefined, vendor)).toThrow(ForbiddenException);
        expect(() => controller.list(owner, undefined)).toThrow(ForbiddenException);
    });
});
