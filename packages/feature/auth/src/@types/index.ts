import type { AuthTokens, JwtPayload } from '@brickam/domain-kit';

/** Назначение OTP-кода. */
export type OtpPurpose = 'verify' | 'reset';

/** Запись OTP во in-memory сторе. */
export type OtpRecord = {
    hash: string;
    expiresAt: number;
    attempts: number;
    lastSentAt: number;
};

/** Результат запроса OTP (код наружу не отдаём). */
export type OtpRequestResult = {
    expiresAt: number;
    phoneMasked: string;
};

/** Запись refresh-токена в сторе ротации. */
export type RefreshRecord = {
    userId: string;
    tokenHash: string;
    payload: JwtPayload;
};

/** Полезная нагрузка refresh-токена. */
export type RefreshTokenPayload = {
    sub: string;
    jti: string;
};

export type RegisterResult = { otpSent: true };
export type VerifyOtpResult = { tokens: AuthTokens };
export type LoginResult = { tokens: AuthTokens } | { otpRequired: true };
export type RefreshResult = { tokens: AuthTokens };
export type ForgotResult = { otpSent: true };
export type ResetResult = { success: true };
