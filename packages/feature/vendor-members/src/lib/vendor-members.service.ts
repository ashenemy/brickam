import { NotFoundException } from '@brickam/core-kit';
import { Role, UsersServiceContract } from '@brickam/domain-kit';
import { Injectable } from '@nestjs/common';
import type { VendorMemberContract } from '../@types';
import type { VendorMemberDocument } from './vendor-member.schema';
import { VendorMembersRepository } from './vendor-members.repository';

/**
 * Сервис команды вендора (Foundations §14, Stage 15). Владелец (vendor_owner)
 * управляет суб-аккаунтами: добавляет по телефону, меняет права, удаляет.
 * Каждое изменение зеркалируется в users через `UsersServiceContract`
 * (setMemberAccess), чтобы role/vendorId/permissions попали в JWT при логине.
 * Границы feature: users доступен только через DI-контракт.
 */
@Injectable()
export class VendorMembersService {
    constructor(
        private readonly membersRepository: VendorMembersRepository,
        private readonly users: UsersServiceContract,
    ) {}

    /** Маппит документ члена команды в плоский контракт. */
    private toContract(doc: VendorMemberDocument): VendorMemberContract {
        return {
            id: doc.id ?? doc._id.toString(),
            vendorId: doc.vendorId,
            userId: doc.userId,
            role: doc.role,
            permissions: doc.permissions,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
    }

    /**
     * Добавляет суб-аккаунт по телефону: ищет пользователя (нет → NotFound),
     * upsert записи vendor_members и назначает доступ через users.setMemberAccess.
     */
    async addMember(
        vendorId: string,
        userPhone: string,
        permissions: string[],
    ): Promise<VendorMemberContract> {
        const user = await this.users.findByPhone(userPhone);
        if (!user) {
            throw new NotFoundException('errors.members.userNotFound');
        }

        const existing = await this.membersRepository.findByVendorUser(vendorId, user.id);
        const doc = existing
            ? await this.membersRepository.updateById(existing.id, {
                  permissions,
                  role: Role.VendorMember,
              })
            : await this.membersRepository.create({
                  vendorId,
                  userId: user.id,
                  role: Role.VendorMember,
                  permissions,
              });

        await this.users.setMemberAccess(user.id, {
            vendorId,
            permissions,
            role: Role.VendorMember,
        });

        // updateById вернёт документ (existing гарантированно есть).
        return this.toContract(doc as VendorMemberDocument);
    }

    /** Список членов команды вендора. */
    async listMembers(vendorId: string): Promise<VendorMemberContract[]> {
        const docs = await this.membersRepository.findByVendor(vendorId);
        return docs.map((doc) => this.toContract(doc));
    }

    /** Меняет права члена команды (запись + зеркало в users). */
    async updateMember(
        vendorId: string,
        userId: string,
        permissions: string[],
    ): Promise<VendorMemberContract> {
        const existing = await this.membersRepository.findByVendorUser(vendorId, userId);
        if (!existing) {
            throw new NotFoundException('errors.members.notFound');
        }
        const updated = await this.membersRepository.updateById(existing.id, { permissions });
        if (!updated) {
            throw new NotFoundException('errors.members.notFound');
        }
        await this.users.setMemberAccess(userId, {
            vendorId,
            permissions,
            role: Role.VendorMember,
        });
        return this.toContract(updated);
    }

    /**
     * Удаляет члена команды: убирает запись и обнуляет права в users
     * (permissions=[], role остаётся vendor_member — доступ к вендору снят).
     */
    async removeMember(vendorId: string, userId: string): Promise<void> {
        const existing = await this.membersRepository.findByVendorUser(vendorId, userId);
        if (!existing) {
            throw new NotFoundException('errors.members.notFound');
        }
        await this.membersRepository.deleteById(existing.id);
        await this.users.setMemberAccess(userId, {
            vendorId,
            permissions: [],
            role: Role.VendorMember,
        });
    }
}
