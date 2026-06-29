import type { Lang } from '@brickam/i18n-kit/browser';

/** Тип аккаунта покупателя. */
export type AccountType = 'individual' | 'company';

/** Профиль текущего пользователя (GET /users/me). passwordHash наружу не отдаётся. */
export type Profile = {
    id: string;
    role: string;
    accountType?: AccountType;
    name: string;
    phone: string;
    phoneVerified: boolean;
    lang: string;
    status: string;
    vendorId?: string;
};

/** Патч профиля (PATCH /users/me). Все поля опциональны. */
export type UpdateProfileInput = {
    name?: string;
    lang?: Lang;
    accountType?: AccountType;
};

/** Смена пароля (POST /users/me/password). */
export type ChangePasswordInput = {
    currentPassword: string;
    newPassword: string;
};
