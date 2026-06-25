import { NotFoundException } from '@brickam/core-kit';
import { Permission, Role, type UsersServiceContract } from '@brickam/domain-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VendorMembersRepository } from './vendor-members.repository';
import { VendorMembersService } from './vendor-members.service';

const makeMemberDoc = (over: Record<string, unknown> = {}) => ({
    id: 'm1',
    _id: { toString: () => 'm1' },
    vendorId: 'v1',
    userId: 'u1',
    role: Role.VendorMember,
    permissions: [Permission.OrdersView],
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-01'),
    ...over,
});

describe('VendorMembersService', () => {
    let repo: {
        findByVendor: ReturnType<typeof vi.fn>;
        findByVendorUser: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        updateById: ReturnType<typeof vi.fn>;
        deleteById: ReturnType<typeof vi.fn>;
    };
    let users: {
        findByPhone: ReturnType<typeof vi.fn>;
        setMemberAccess: ReturnType<typeof vi.fn>;
    };
    let service: VendorMembersService;

    beforeEach(() => {
        repo = {
            findByVendor: vi.fn().mockResolvedValue([]),
            findByVendorUser: vi.fn().mockResolvedValue(null),
            create: vi.fn(),
            updateById: vi.fn(),
            deleteById: vi.fn().mockResolvedValue(true),
        };
        users = {
            findByPhone: vi.fn(),
            setMemberAccess: vi.fn().mockResolvedValue(undefined),
        };
        service = new VendorMembersService(
            repo as unknown as VendorMembersRepository,
            users as unknown as UsersServiceContract,
        );
    });

    describe('addMember', () => {
        it('бросает NotFound, если пользователь по телефону не найден', async () => {
            users.findByPhone.mockResolvedValue(null);
            await expect(
                service.addMember('v1', '+37499000000', [Permission.OrdersView]),
            ).rejects.toBeInstanceOf(NotFoundException);
            expect(users.setMemberAccess).not.toHaveBeenCalled();
        });

        it('создаёт запись и зеркалит доступ в users с правильными permissions', async () => {
            users.findByPhone.mockResolvedValue({ id: 'u1', phone: '+37499000000' });
            repo.findByVendorUser.mockResolvedValue(null);
            repo.create.mockResolvedValue(makeMemberDoc());

            const member = await service.addMember('v1', '+37499000000', [
                Permission.OrdersView,
                Permission.ProductsManage,
            ]);

            expect(repo.create).toHaveBeenCalledWith({
                vendorId: 'v1',
                userId: 'u1',
                role: Role.VendorMember,
                permissions: [Permission.OrdersView, Permission.ProductsManage],
            });
            expect(users.setMemberAccess).toHaveBeenCalledWith('u1', {
                vendorId: 'v1',
                permissions: [Permission.OrdersView, Permission.ProductsManage],
                role: Role.VendorMember,
            });
            expect(member.userId).toBe('u1');
        });

        it('upsert: обновляет существующую запись вместо создания', async () => {
            users.findByPhone.mockResolvedValue({ id: 'u1', phone: '+37499000000' });
            repo.findByVendorUser.mockResolvedValue(makeMemberDoc());
            repo.updateById.mockResolvedValue(
                makeMemberDoc({ permissions: [Permission.ChatHandle] }),
            );

            await service.addMember('v1', '+37499000000', [Permission.ChatHandle]);

            expect(repo.create).not.toHaveBeenCalled();
            expect(repo.updateById).toHaveBeenCalledWith('m1', {
                permissions: [Permission.ChatHandle],
                role: Role.VendorMember,
            });
            expect(users.setMemberAccess).toHaveBeenCalledWith(
                'u1',
                expect.objectContaining({ permissions: [Permission.ChatHandle] }),
            );
        });
    });

    describe('listMembers', () => {
        it('возвращает контракты членов команды вендора', async () => {
            repo.findByVendor.mockResolvedValue([makeMemberDoc(), makeMemberDoc({ id: 'm2' })]);
            const members = await service.listMembers('v1');
            expect(repo.findByVendor).toHaveBeenCalledWith('v1');
            expect(members).toHaveLength(2);
        });
    });

    describe('updateMember', () => {
        it('обновляет права записи и зеркалит в users', async () => {
            repo.findByVendorUser.mockResolvedValue(makeMemberDoc());
            repo.updateById.mockResolvedValue(
                makeMemberDoc({ permissions: [Permission.AnalyticsView] }),
            );

            const member = await service.updateMember('v1', 'u1', [Permission.AnalyticsView]);

            expect(repo.updateById).toHaveBeenCalledWith('m1', {
                permissions: [Permission.AnalyticsView],
            });
            expect(users.setMemberAccess).toHaveBeenCalledWith('u1', {
                vendorId: 'v1',
                permissions: [Permission.AnalyticsView],
                role: Role.VendorMember,
            });
            expect(member.permissions).toEqual([Permission.AnalyticsView]);
        });

        it('бросает NotFound, если члена команды нет', async () => {
            repo.findByVendorUser.mockResolvedValue(null);
            await expect(service.updateMember('v1', 'uX', [])).rejects.toBeInstanceOf(
                NotFoundException,
            );
        });
    });

    describe('removeMember', () => {
        it('удаляет запись и обнуляет права в users', async () => {
            repo.findByVendorUser.mockResolvedValue(makeMemberDoc());

            await service.removeMember('v1', 'u1');

            expect(repo.deleteById).toHaveBeenCalledWith('m1');
            expect(users.setMemberAccess).toHaveBeenCalledWith('u1', {
                vendorId: 'v1',
                permissions: [],
                role: Role.VendorMember,
            });
        });

        it('бросает NotFound, если члена команды нет', async () => {
            repo.findByVendorUser.mockResolvedValue(null);
            await expect(service.removeMember('v1', 'uX')).rejects.toBeInstanceOf(
                NotFoundException,
            );
            expect(repo.deleteById).not.toHaveBeenCalled();
        });
    });
});
