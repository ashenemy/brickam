/** Пара JWT-токенов от бэкенда. */
export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};

/** Ответ регистрации: код подтверждения отправлен. */
export type RegisterResult = {
    otpSent: boolean;
};

/** Результат логина/верификации OTP — пара токенов. */
export type AuthResult = {
    tokens: AuthTokens;
};

/**
 * Профиль текущего пользователя с эндпоинта GET /auth/me.
 * Роль — источник истины для гейта маршрутов (токен в httpOnly-cookie,
 * JS его не читает, поэтому роль берётся с бэкенда, а не из JWT-декода).
 */
export type UserProfile = {
    id: string;
    role: string;
    permissions: string[];
    vendorId?: string;
};
