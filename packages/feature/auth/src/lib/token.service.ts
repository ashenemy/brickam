import { randomUUID } from 'node:crypto';
import { AppConfigService } from '@brickam/config-kit';
import { UnauthorizedException } from '@brickam/core-kit';
import type { AuthTokens, JwtPayload } from '@brickam/domain-kit';
import { InMemoryKeyValueStore, KeyValueStore } from '@brickam/server-kit';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import type { RefreshRecord, RefreshTokenPayload } from '../@types';

const BCRYPT_ROUNDS = 10;

/** Множители единиц TTL (формат `\d+[smhdw]`, валидируется config-kit). */
const TTL_UNIT_SECONDS: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86_400,
    w: 604_800,
};

/** Парсит TTL вида `30d`/`15m` в секунды (формат гарантирован config-kit). */
function ttlToSeconds(ttl: string): number {
    const match = /^(\d+)([smhdw])$/.exec(ttl);
    if (!match) {
        return 0;
    }
    return Number(match[1]) * TTL_UNIT_SECONDS[match[2]];
}

/**
 * Выпуск/проверка/ротация JWT. Access и refresh подписаны разными секретами.
 * Refresh-токены отслеживаются в {@link KeyValueStore} по jti для инвалидации
 * (Redis в проде → мультиинстансная консистентность, in-memory в dev/тестах).
 * KV инжектится как @Optional с фолбэком на внутренний InMemoryKeyValueStore.
 */
@Injectable()
export class TokenService {
    private readonly store: KeyValueStore;

    constructor(
        private readonly jwt: JwtService,
        private readonly config: AppConfigService,
        @Optional() @Inject(KeyValueStore) kv?: KeyValueStore,
    ) {
        this.store = kv ?? new InMemoryKeyValueStore();
    }

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
        const record: RefreshRecord = { userId: payload.sub, tokenHash, payload };
        await this.store.set(this.key(jti), record, ttlToSeconds(jwtConfig.refreshTtl));

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

        const record = await this.store.get<RefreshRecord>(this.key(decoded.jti));
        if (!record) {
            throw new UnauthorizedException('errors.unauthorized');
        }

        const matches = await bcrypt.compare(refreshToken, record.tokenHash);
        if (!matches) {
            throw new UnauthorizedException('errors.unauthorized');
        }

        // Инвалидация старого refresh (одноразовость).
        await this.store.del(this.key(decoded.jti));

        return this.issueTokens(record.payload);
    }

    private key(jti: string): string {
        return `refresh:${jti}`;
    }
}
