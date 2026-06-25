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
