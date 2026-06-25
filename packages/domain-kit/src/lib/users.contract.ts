import type {
    CreateUserContract,
    LoyaltyMetric,
    LoyaltyUpdate,
    MemberAccess,
    UserContract,
} from '../@types';

/**
 * Контракт сервиса пользователей. Абстрактный класс служит DI-токеном:
 * реализацию предоставляет feature `users`, а `auth` зависит только от этого
 * контракта (не импортирует feature `users` напрямую — Foundations §1).
 */
export abstract class UsersServiceContract {
    abstract findByPhone(phone: string): Promise<UserContract | null>;
    abstract findById(id: string): Promise<UserContract | null>;
    abstract createUser(data: CreateUserContract): Promise<UserContract>;
    abstract markPhoneVerified(id: string): Promise<void>;
    abstract updatePassword(id: string, passwordHash: string): Promise<void>;

    /**
     * Метрика лояльности покупателя (users.loyalty). Дефолт — нули; реальная
     * реализация в `users` переопределяет. Неабстрактный метод, чтобы не ломать
     * существующих реализаторов контракта.
     */
    async getLoyaltyMetric(_userId: string): Promise<LoyaltyMetric> {
        return { totalSpend: 0, totalOrders: 0 };
    }

    /** Обновляет метрику лояльности (users.loyalty). Дефолт — no-op. */
    async updateLoyalty(_userId: string, _update: LoyaltyUpdate): Promise<void> {}

    /**
     * Назначает суб-аккаунту доступ к вендору (vendorId/role/permissions попадают
     * в JWT и проверяются PermissionsGuard). Дефолт — no-op; реализует `users`.
     */
    async setMemberAccess(_userId: string, _access: MemberAccess): Promise<void> {}
}
