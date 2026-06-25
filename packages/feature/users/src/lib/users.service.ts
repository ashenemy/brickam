import {
    type CreateUserContract,
    type LoyaltyMetric,
    type LoyaltyUpdate,
    type MemberAccess,
    type UserContract,
    UsersServiceContract,
} from '@brickam/domain-kit';
import { BaseCrudService } from '@brickam/server-kit';
import { Injectable } from '@nestjs/common';
import type { User, UserDocument } from './user.schema';
import { UsersRepository } from './users.repository';

/**
 * Сервис пользователей. Наследует CRUD-инфраструктуру (BaseCrudService) и
 * реализует контракт `UsersServiceContract` из domain-kit — наружу отдаёт POJO
 * `UserContract`, не Mongoose-документ (Foundations §1, §14/§15).
 */
@Injectable()
export class UsersService
    extends BaseCrudService<User, CreateUserContract, Partial<User>>
    implements UsersServiceContract
{
    constructor(private readonly usersRepository: UsersRepository) {
        super(usersRepository);
    }

    /**
     * Маппит Mongoose-документ в плоский контракт пользователя. Опциональные
     * поля добавляются только при наличии значения (exactOptionalPropertyTypes).
     */
    private toContract(doc: UserDocument): UserContract {
        const contract: UserContract = {
            id: doc.id ?? doc._id.toString(),
            role: doc.role,
            name: doc.name,
            phone: doc.phone,
            phoneVerified: doc.phoneVerified,
            passwordHash: doc.passwordHash,
            lang: doc.lang,
            status: doc.status,
        };
        if (doc.accountType !== undefined) {
            contract.accountType = doc.accountType;
        }
        if (doc.vendorId !== undefined) {
            contract.vendorId = doc.vendorId;
        }
        if (doc.permissions !== undefined) {
            contract.permissions = doc.permissions;
        }
        return contract;
    }

    async findByPhone(phone: string): Promise<UserContract | null> {
        const doc = await this.usersRepository.findByPhone(phone);
        return doc ? this.toContract(doc) : null;
    }

    async findById(id: string): Promise<UserContract | null> {
        const doc = await this.usersRepository.findById(id);
        return doc ? this.toContract(doc) : null;
    }

    async createUser(data: CreateUserContract): Promise<UserContract> {
        const doc = await this.usersRepository.create(data as Partial<User>);
        return this.toContract(doc);
    }

    async markPhoneVerified(id: string): Promise<void> {
        await this.usersRepository.updateById(id, { phoneVerified: true });
    }

    async updatePassword(id: string, passwordHash: string): Promise<void> {
        await this.usersRepository.updateById(id, { passwordHash });
    }

    /** Метрика лояльности покупателя (users.loyalty). */
    async getLoyaltyMetric(userId: string): Promise<LoyaltyMetric> {
        const doc = await this.usersRepository.findById(userId);
        const loyalty = doc?.loyalty;
        return {
            totalSpend: loyalty?.totalSpend ?? 0,
            totalOrders: loyalty?.totalOrders ?? 0,
            ...(loyalty?.currentTierId !== undefined
                ? { currentTierId: loyalty.currentTierId }
                : {}),
        };
    }

    /** Обновляет метрику лояльности покупателя (users.loyalty). */
    async updateLoyalty(userId: string, update: LoyaltyUpdate): Promise<void> {
        await this.usersRepository.updateById(userId, {
            loyalty: {
                totalSpend: update.totalSpend,
                totalOrders: update.totalOrders,
                ...(update.currentTierId !== undefined
                    ? { currentTierId: update.currentTierId }
                    : {}),
            },
        } as Partial<User>);
    }

    /**
     * Назначает суб-аккаунту доступ к вендору. role/vendorId/permissions
     * попадут в JWT при следующем логине и проверяются PermissionsGuard
     * (Foundations §14). Вызывается из feature `vendor-members`.
     */
    async setMemberAccess(userId: string, access: MemberAccess): Promise<void> {
        await this.usersRepository.updateById(userId, {
            role: access.role,
            vendorId: access.vendorId,
            permissions: access.permissions,
        } as Partial<User>);
    }
}
