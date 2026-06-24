import { NotFoundException } from '@brickam/core-kit';
import { Role, UserStatus } from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersController } from './users.controller';
import type { UsersService } from './users.service';

describe('UsersController', () => {
    let service: { findById: ReturnType<typeof vi.fn> };
    let controller: UsersController;

    beforeEach(() => {
        service = { findById: vi.fn() };
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
});
