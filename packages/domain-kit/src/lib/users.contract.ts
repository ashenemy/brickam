import type { CreateUserContract, UserContract } from '../@types';

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
}
