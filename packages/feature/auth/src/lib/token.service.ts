import { randomUUID } from 'node:crypto';
import { AppConfigService } from '@brickam/config-kit';
import { UnauthorizedException } from '@brickam/core-kit';
import type { AuthTokens, JwtPayload } from '@brickam/domain-kit';
import { Injectable } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import type { RefreshRecord, RefreshTokenPayload } from '../@types';

const BCRYPT_ROUNDS = 10;

/**
 * Выпуск/проверка/ротация JWT. Access и refresh подписаны разными секретами.
 * Refresh-токены отслеживаются в in-memory сторе по jti для инвалидации.
 */
@Injectable()
export class TokenService {
    private readonly refreshStore = new Map<string, RefreshRecord>();

    constructor(
        private readonly jwt: JwtService,
        private readonly config: AppConfigService,
    ) {}

    /** Выпускает пару токенов и регистрирует refresh в сторе ротации. */
    async issueTokens(payload: JwtPayload): Promise<AuthTokens> {
        const jwtConfig = this.config.auth.jwt;
        // TTL валидируется config-kit как `\d+[smhdw]` (формат ms.StringValue).
        const accessOptions = {
            secret: jwtConfig.accessSecret,
            expiresIn: jwtConfig.accessTtl,
        } as JwtSignOptions;
        const accessToken = await this.jwt.signAsync(payload, accessOptions);

        const jti = randomUUID();
        const refreshPayload: RefreshTokenPayload = { sub: payload.sub, jti };
        const refreshOptions = {
            secret: jwtConfig.refreshSecret,
            expiresIn: jwtConfig.refreshTtl,
        } as JwtSignOptions;
        const refreshToken = await this.jwt.signAsync(refreshPayload, refreshOptions);

        const tokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
        this.refreshStore.set(jti, { userId: payload.sub, tokenHash, payload });

        return { accessToken, refreshToken };
    }

    /** Проверяет access-токен и возвращает payload. */
    verifyAccess(token: string): JwtPayload {
        try {
            return this.jwt.verify<JwtPayload>(token, {
                secret: this.config.auth.jwt.accessSecret,
            });
        } catch {
            throw new UnauthorizedException('errors.unauthorized');
        }
    }

    /**
     * Ротация refresh: валидирует токен, сверяет хеш по jti, инвалидирует старый
     * и выпускает новую пару от сохранённого payload пользователя.
     */
    async rotate(refreshToken: string): Promise<AuthTokens> {
        let decoded: RefreshTokenPayload;
        try {
            decoded = this.jwt.verify<RefreshTokenPayload>(refreshToken, {
                secret: this.config.auth.jwt.refreshSecret,
            });
        } catch {
            throw new UnauthorizedException('errors.unauthorized');
        }

        const record = this.refreshStore.get(decoded.jti);
        if (!record) {
            throw new UnauthorizedException('errors.unauthorized');
        }

        const matches = await bcrypt.compare(refreshToken, record.tokenHash);
        if (!matches) {
            throw new UnauthorizedException('errors.unauthorized');
        }

        // Инвалидация старого refresh (одноразовость).
        this.refreshStore.delete(decoded.jti);

        return this.issueTokens(record.payload);
    }
}
