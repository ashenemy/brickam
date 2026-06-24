import type { AccountType, Permission, Role, UserStatus } from '../lib/roles';

/**
 * Контракт пользователя — POJO, которым обмениваются фичи (без Mongoose-документа).
 * passwordHash нужен auth для проверки пароля; наружу не отдаётся (@Exclude в схеме/DTO).
 */
export type UserContract = {
    id: string;
    role: Role;
    accountType?: AccountType;
    name: string;
    phone: string;
    phoneVerified: boolean;
    passwordHash: string;
    lang: string;
    status: UserStatus;
    vendorId?: string;
    permissions?: Permission[];
};

/** Данные создания пользователя (пароль уже захеширован вызывающим auth). */
export type CreateUserContract = {
    role: Role;
    accountType?: AccountType;
    name: string;
    phone: string;
    passwordHash: string;
    lang?: string;
};

/** Полезная нагрузка JWT (access). */
export type JwtPayload = {
    sub: string;
    role: Role;
    permissions: Permission[];
    vendorId?: string;
};

/** Пара токенов. */
export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};

/** Мультиязычный текст (hy — дефолт). */
export type LocalizedText = {
    hy: string;
    ru: string;
    en: string;
};

/** Тип шаблона/канала. */
export type TemplateType = 'email' | 'sms';

/** Переменные для подстановки в шаблон (белый список — в самом шаблоне). */
export type TemplateVars = Record<string, string | number | boolean>;

/** Результат рендера шаблона. */
export type RenderedTemplate = {
    subject?: string;
    body: string;
};
