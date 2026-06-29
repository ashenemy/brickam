import { NotFoundException } from '@brickam/core-kit';
import { Role, UserStatus } from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersController } from './users.controller';
import type { UsersService } from './users.service';

describe('UsersController', () => {
    let service: {
        findById: ReturnType<typeof vi.fn>;
        updateProfile: ReturnType<typeof vi.fn>;
        changePassword: ReturnType<typeof vi.fn>;
    };
    let controller: UsersController;

    beforeEach(() => {
        service = {
            findById: vi.fn(),
            updateProfile: vi.fn(),
            changePassword: vi.fn(),
        };
        controller = new UsersController(service as unknown as UsersService);
    });

    it('me возвращает профиль текущего пользователя', async () => {
        const user = {
            id: 'u1',
            role: Role.Buyer,
            name: 'Արամ',
            phone: '+37499000000',
            phoneVerified: true,
            passwordHash: 'h',
            lang: 'hy',
            status: UserStatus.Active,
        };
        service.findById.mockResolvedValue(user);
        expect(await controller.me('u1')).toBe(user);
        expect(service.findById).toHaveBeenCalledWith('u1');
    });

    it('me бросает NotFoundException, если пользователь не найден', async () => {
        service.findById.mockResolvedValue(null);
        await expect(controller.me('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('update делегирует updateProfile и возвращает контракт', async () => {
        const updated = { id: 'u1', name: 'Նոր', lang: 'ru' };
        service.updateProfile.mockResolvedValue(updated);
        const dto = { name: 'Նոր', lang: 'ru' };
        expect(await controller.update('u1', dto)).toBe(updated);
        expect(service.updateProfile).toHaveBeenCalledWith('u1', dto);
    });

    it('changePassword делегирует сервису и возвращает success', async () => {
        service.changePassword.mockResolvedValue(undefined);
        const dto = { currentPassword: 'oldsecret1', newPassword: 'newsecret1' };
        expect(await controller.changePassword('u1', dto)).toEqual({ success: true });
        expect(service.changePassword).toHaveBeenCalledWith('u1', dto);
    });
});
