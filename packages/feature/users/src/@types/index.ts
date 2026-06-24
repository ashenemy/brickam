/** Сводка по лояльности пользователя (вложена в документ User, Foundations §15). */
export type UserLoyalty = {
    currentTierId?: string;
    totalSpend: number;
    totalOrders: number;
};

// Реэкспорт контрактов пользователей из domain-kit для удобства потребителей.
export type {
    CreateUserContract,
    UserContract,
} from '@brickam/domain-kit';
