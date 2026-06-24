import { AppConfigService } from '@brickam/config-kit';
import { UnauthorizedException } from '@brickam/core-kit';
import { type JwtPayload, Permission, Role } from '@brickam/domain-kit';
import { JwtService } from '@nestjs/jwt';
import { describe, expect, it } from 'vitest';
import { TokenService } from './token.service';

function makeConfig(): AppConfigService {
    return {
        auth: {
            jwt: {
                accessTtl: '15m',
                refreshTtl: '30d',
                accessSecret: 'access-secret',
                refreshSecret: 'refresh-secret',
            },
        },
    } as unknown as AppConfigService;
}

const payload: JwtPayload = {
    sub: 'user-1',
    role: Role.VendorOwner,
    permissions: [Permission.ProductsManage],
    vendorId: 'vendor-1',
};

function makeService(): TokenService {
    return new TokenService(new JwtService(), makeConfig());
}

describe('TokenService', () => {
    it('issueTokens → verifyAccess возвращает исходный payload', async () => {
        const service = makeService();
        const tokens = await service.issueTokens(payload);
        expect(tokens.accessToken).toBeTruthy();
        expect(tokens.refreshToken).toBeTruthy();

        const decoded = service.verifyAccess(tokens.accessToken);
        expect(decoded.sub).toBe('user-1');
        expect(decoded.role).toBe(Role.VendorOwner);
        expect(decoded.permissions).toEqual([Permission.ProductsManage]);
        expect(decoded.vendorId).toBe('vendor-1');
    });

    it('verifyAccess невалидного токена → UnauthorizedException', () => {
        const service = makeService();
        expect(() => service.verifyAccess('garbage')).toThrow(UnauthorizedException);
    });

    it('rotate выдаёт новую пару и инвалидирует старый refresh', async () => {
        const service = makeService();
        const first = await service.issueTokens(payload);

        const rotated = await service.rotate(first.refreshToken);
        expect(rotated.refreshToken).not.toBe(first.refreshToken);

        const decoded = service.verifyAccess(rotated.accessToken);
        expect(decoded.sub).toBe('user-1');

        // повторная ротация старым refresh → Unauthorized (jti инвалидирован)
        await expect(service.rotate(first.refreshToken)).rejects.toBeInstanceOf(
            UnauthorizedException,
        );
    });

    it('rotate невалидного refresh → UnauthorizedException', async () => {
        const service = makeService();
        await expect(service.rotate('garbage')).rejects.toBeInstanceOf(UnauthorizedException);
    });
});
