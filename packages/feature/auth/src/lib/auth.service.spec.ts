import { AppConfigService } from '@brickam/config-kit';
import {
    ConflictException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
} from '@brickam/core-kit';
import {
    type CreateUserContract,
    Role,
    type UserContract,
    UserStatus,
    type UsersServiceContract,
} from '@brickam/domain-kit';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';

/** In-memory реализация контракта пользователей для тестов. */
class FakeUsersService implements UsersServiceContract {
    private readonly byPhone = new Map<string, UserContract>();
    public createCalls: CreateUserContract[] = [];
    public verifiedIds: string[] = [];
    public passwordUpdates: Array<{ id: string; hash: string }> = [];
    public vendorIdSets: Array<{ id: string; vendorId: string }> = [];

    seed(user: UserContract): void {
        this.byPhone.set(user.phone, user);
    }

    setVendorId(id: string, vendorId: string): Promise<void> {
        this.vendorIdSets.push({ id, vendorId });
        for (const u of this.byPhone.values()) {
            if (u.id === id) u.vendorId = vendorId;
        }
        return Promise.resolve();
    }

    findByPhone(phone: string): Promise<UserContract | null> {
        return Promise.resolve(this.byPhone.get(phone) ?? null);
    }

    findById(id: string): Promise<UserContract | null> {
        for (const u of this.byPhone.values()) {
            if (u.id === id) return Promise.resolve(u);
        }
        return Promise.resolve(null);
    }

    createUser(data: CreateUserContract): Promise<UserContract> {
        this.createCalls.push(data);
        const user: UserContract = {
            id: `id-${this.byPhone.size + 1}`,
            role: data.role,
            name: data.name,
            phone: data.phone,
            phoneVerified: false,
            passwordHash: data.passwordHash,
            lang: data.lang ?? 'hy',
            status: UserStatus.Active,
            ...(data.accountType !== undefined ? { accountType: data.accountType } : {}),
        };
        this.byPhone.set(user.phone, user);
        return Promise.resolve(user);
    }

    markPhoneVerified(id: string): Promise<void> {
        this.verifiedIds.push(id);
        for (const u of this.byPhone.values()) {
            if (u.id === id) u.phoneVerified = true;
        }
        return Promise.resolve();
    }

    updatePassword(id: string, passwordHash: string): Promise<void> {
        this.passwordUpdates.push({ id, hash: passwordHash });
        return Promise.resolve();
    }
}

function otpConfig(): AppConfigService {
    return {
        auth: {
            otp: { length: 6, ttlSeconds: 300, maxAttempts: 3, resendCooldownSeconds: 60 },
            jwt: {
                accessTtl: '15m',
                refreshTtl: '30d',
                accessSecret: 'a',
                refreshSecret: 'r',
            },
        },
    } as unknown as AppConfigService;
}

function setup() {
    const users = new FakeUsersService();
    const notifications = { sendSms: vi.fn(), sendEmail: vi.fn() } as never;
    const otp = new OtpService(otpConfig(), notifications);
    const tokens = new TokenService(new JwtService(), otpConfig());
    const service = new AuthService(users, otp, tokens);
    return { users, otp, tokens, service };
}

describe('AuthService', () => {
    let ctx: ReturnType<typeof setup>;

    beforeEach(() => {
        ctx = setup();
    });

    describe('register', () => {
        it('занятый телефон → ConflictException', async () => {
            ctx.users.seed({
                id: 'u1',
                role: Role.Buyer,
                name: 'A',
                phone: '+37412345678',
                phoneVerified: true,
                passwordHash: 'h',
                lang: 'hy',
                status: UserStatus.Active,
            });
            await expect(
                ctx.service.register({
                    phone: '+37412345678',
                    password: 'secret123',
                    name: 'B',
                    role: Role.Buyer,
                }),
            ).rejects.toBeInstanceOf(ConflictException);
        });

        it('happy: otpSent, createUser вызван, пароль захеширован', async () => {
            const otpSpy = vi.spyOn(ctx.otp, 'request').mockResolvedValue({
                expiresAt: Date.now() + 1000,
                phoneMasked: '+374***78',
            });
            const result = await ctx.service.register({
                phone: '+37412345678',
                password: 'secret123',
                name: 'B',
                role: Role.VendorOwner,
            });
            expect(result).toEqual({ otpSent: true });
            expect(ctx.users.createCalls).toHaveLength(1);
            const created = ctx.users.createCalls[0];
            expect(created?.passwordHash).not.toBe('secret123');
            expect(await bcrypt.compare('secret123', created?.passwordHash ?? '')).toBe(true);
            expect(otpSpy).toHaveBeenCalledWith('+37412345678', 'verify');
        });

        it('vendor_owner: онбординг создаёт вендора и привязывает vendorId', async () => {
            vi.spyOn(ctx.otp, 'request').mockResolvedValue({
                expiresAt: Date.now() + 1000,
                phoneMasked: 'x',
            });
            const vendors = {
                createForOwner: vi.fn().mockResolvedValue({ vendorId: 'v-new' }),
                setRating: vi.fn(),
            };
            const svc = new AuthService(ctx.users, ctx.otp, ctx.tokens, vendors as never);
            await svc.register({
                phone: '+37499999999',
                password: 'secret123',
                name: 'V',
                role: Role.VendorOwner,
            });
            expect(vendors.createForOwner).toHaveBeenCalledTimes(1);
            expect(ctx.users.vendorIdSets).toHaveLength(1);
            expect(ctx.users.vendorIdSets[0]?.vendorId).toBe('v-new');
        });

        it('buyer: онбординг вендора НЕ запускается', async () => {
            vi.spyOn(ctx.otp, 'request').mockResolvedValue({
                expiresAt: Date.now() + 1000,
                phoneMasked: 'x',
            });
            const vendors = { createForOwner: vi.fn(), setRating: vi.fn() };
            const svc = new AuthService(ctx.users, ctx.otp, ctx.tokens, vendors as never);
            await svc.register({
                phone: '+37488888888',
                password: 'secret123',
                name: 'B',
                role: Role.Buyer,
            });
            expect(vendors.createForOwner).not.toHaveBeenCalled();
        });
    });

    describe('verifyOtp', () => {
        it('помечает телефон верифицированным и выдаёт токены', async () => {
            ctx.users.seed({
                id: 'u1',
                role: Role.Buyer,
                name: 'A',
                phone: '+37412345678',
                phoneVerified: false,
                passwordHash: 'h',
                lang: 'hy',
                status: UserStatus.Active,
            });
            vi.spyOn(ctx.otp, 'verify').mockResolvedValue(undefined);

            const result = await ctx.service.verifyOtp({
                phone: '+37412345678',
                code: '123456',
                deviceId: 'dev-1',
            });
            expect(ctx.users.verifiedIds).toContain('u1');
            expect('tokens' in result && result.tokens.accessToken).toBeTruthy();
        });

        it('пользователь не найден → NotFoundException', async () => {
            vi.spyOn(ctx.otp, 'verify').mockResolvedValue(undefined);
            await expect(
                ctx.service.verifyOtp({ phone: '+37400000000', code: '123456' }),
            ).rejects.toBeInstanceOf(NotFoundException);
        });
    });

    describe('login', () => {
        it('неверный пароль → UnauthorizedException', async () => {
            const hash = await bcrypt.hash('correct', 10);
            ctx.users.seed({
                id: 'u1',
                role: Role.Buyer,
                name: 'A',
                phone: '+37412345678',
                phoneVerified: true,
                passwordHash: hash,
                lang: 'hy',
                status: UserStatus.Active,
            });
            await expect(
                ctx.service.login({ phone: '+37412345678', password: 'wrong' }),
            ).rejects.toBeInstanceOf(UnauthorizedException);
        });

        it('happy: выдаёт токены и запоминает устройство', async () => {
            const hash = await bcrypt.hash('correct', 10);
            ctx.users.seed({
                id: 'u1',
                role: Role.Buyer,
                name: 'A',
                phone: '+37412345678',
                phoneVerified: true,
                passwordHash: hash,
                lang: 'hy',
                status: UserStatus.Active,
            });
            const result = await ctx.service.login({
                phone: '+37412345678',
                password: 'correct',
                deviceId: 'dev-1',
            });
            expect('tokens' in result && result.tokens.refreshToken).toBeTruthy();
        });

        it('неизвестный телефон → UnauthorizedException', async () => {
            await expect(
                ctx.service.login({ phone: '+37400000000', password: 'x' }),
            ).rejects.toBeInstanceOf(UnauthorizedException);
        });

        it('заблокированный пользователь → ForbiddenException', async () => {
            ctx.users.seed({
                id: 'u1',
                role: Role.Buyer,
                name: 'A',
                phone: '+37412345678',
                phoneVerified: true,
                passwordHash: 'h',
                lang: 'hy',
                status: UserStatus.Blocked,
            });
            await expect(
                ctx.service.login({ phone: '+37412345678', password: 'x' }),
            ).rejects.toBeInstanceOf(ForbiddenException);
        });

        it('неподтверждённый телефон → ForbiddenException', async () => {
            ctx.users.seed({
                id: 'u1',
                role: Role.Buyer,
                name: 'A',
                phone: '+37412345678',
                phoneVerified: false,
                passwordHash: 'h',
                lang: 'hy',
                status: UserStatus.Active,
            });
            await expect(
                ctx.service.login({ phone: '+37412345678', password: 'x' }),
            ).rejects.toBeInstanceOf(ForbiddenException);
        });

        it('новое устройство при requireDeviceOtp → otpRequired без токенов', async () => {
            const hash = await bcrypt.hash('correct', 10);
            ctx.users.seed({
                id: 'u1',
                role: Role.Buyer,
                name: 'A',
                phone: '+37412345678',
                phoneVerified: true,
                passwordHash: hash,
                lang: 'hy',
                status: UserStatus.Active,
            });
            // включаем приватный флаг
            (ctx.service as unknown as { requireDeviceOtp: boolean }).requireDeviceOtp = true;
            const otpSpy = vi.spyOn(ctx.otp, 'request').mockResolvedValue({
                expiresAt: Date.now() + 1000,
                phoneMasked: 'm',
            });
            const result = await ctx.service.login({
                phone: '+37412345678',
                password: 'correct',
                deviceId: 'new-dev',
            });
            expect(result).toEqual({ otpRequired: true });
            expect(otpSpy).toHaveBeenCalledWith('+37412345678', 'verify', 'hy');
        });
    });

    describe('refresh', () => {
        it('делегирует ротацию токенов', async () => {
            const rotated = { accessToken: 'na', refreshToken: 'nr' };
            const spy = vi.spyOn(ctx.tokens, 'rotate').mockResolvedValue(rotated);
            const result = await ctx.service.refresh({ refreshToken: 'old' });
            expect(result).toEqual({ tokens: rotated });
            expect(spy).toHaveBeenCalledWith('old');
        });
    });

    describe('forgot', () => {
        it('пользователь есть → запрашивает OTP reset', async () => {
            ctx.users.seed({
                id: 'u1',
                role: Role.Buyer,
                name: 'A',
                phone: '+37412345678',
                phoneVerified: true,
                passwordHash: 'h',
                lang: 'hy',
                status: UserStatus.Active,
            });
            const spy = vi.spyOn(ctx.otp, 'request').mockResolvedValue({
                expiresAt: Date.now() + 1000,
                phoneMasked: 'm',
            });
            const result = await ctx.service.forgot({ phone: '+37412345678' });
            expect(result).toEqual({ otpSent: true });
            expect(spy).toHaveBeenCalledWith('+37412345678', 'reset', 'hy');
        });

        it('пользователя нет → otpSent без запроса OTP (не раскрывает)', async () => {
            const spy = vi.spyOn(ctx.otp, 'request');
            const result = await ctx.service.forgot({ phone: '+37400000000' });
            expect(result).toEqual({ otpSent: true });
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('reset', () => {
        it('проверяет OTP и обновляет пароль', async () => {
            ctx.users.seed({
                id: 'u1',
                role: Role.Buyer,
                name: 'A',
                phone: '+37412345678',
                phoneVerified: true,
                passwordHash: 'old',
                lang: 'hy',
                status: UserStatus.Active,
            });
            vi.spyOn(ctx.otp, 'verify').mockResolvedValue(undefined);

            const result = await ctx.service.reset({
                phone: '+37412345678',
                code: '123456',
                newPassword: 'newsecret123',
            });
            expect(result).toEqual({ success: true });
            expect(ctx.users.passwordUpdates).toHaveLength(1);
            const update = ctx.users.passwordUpdates[0];
            expect(await bcrypt.compare('newsecret123', update?.hash ?? '')).toBe(true);
        });

        it('пользователь не найден → NotFoundException', async () => {
            vi.spyOn(ctx.otp, 'verify').mockResolvedValue(undefined);
            await expect(
                ctx.service.reset({
                    phone: '+37400000000',
                    code: '123456',
                    newPassword: 'newsecret123',
                }),
            ).rejects.toBeInstanceOf(NotFoundException);
        });
    });
});
