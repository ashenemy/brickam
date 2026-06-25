import {
    ConflictException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
} from '@brickam/core-kit';
import {
    type CreateUserContract,
    DEFAULT_ROLE_PERMISSIONS,
    type JwtPayload,
    Role,
    UserStatus,
    UsersServiceContract,
    VendorsServiceContract,
} from '@brickam/domain-kit';
import { Inject, Injectable, Optional } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import type {
    ForgotResult,
    LoginResult,
    RefreshResult,
    RegisterResult,
    ResetResult,
    VerifyOtpResult,
} from '../@types';
import type { ForgotDto } from './dto/forgot.dto';
import type { LoginDto } from './dto/login.dto';
import type { RefreshDto } from './dto/refresh.dto';
import type { RegisterDto } from './dto/register.dto';
import type { ResetDto } from './dto/reset.dto';
import type { VerifyOtpDto } from './dto/verify-otp.dto';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';

const BCRYPT_ROUNDS = 10;
const DEFAULT_LANG = 'hy';

/** Прикладная логика аутентификации: регистрация, OTP, вход, refresh, сброс. */
@Injectable()
export class AuthService {
    /** Включает OTP при входе с нового устройства (default: выключено). */
    private readonly requireDeviceOtp = false;

    /** Известные устройства пользователя: userId -> Set<deviceId>. */
    private readonly knownDevices = new Map<string, Set<string>>();

    constructor(
        private readonly users: UsersServiceContract,
        private readonly otp: OtpService,
        private readonly tokens: TokenService,
        // Онбординг владельца вендора. Опционально: без vendors-модуля (напр. в
        // изолированных тестах) регистрация работает в прежнем режиме.
        @Optional()
        @Inject(VendorsServiceContract)
        private readonly vendors?: VendorsServiceContract,
    ) {}

    /** Регистрация: создаёт пользователя и отправляет OTP подтверждения телефона. */
    async register(dto: RegisterDto): Promise<RegisterResult> {
        const existing = await this.users.findByPhone(dto.phone);
        if (existing) {
            throw new ConflictException('errors.auth.phoneTaken');
        }

        const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
        const data: CreateUserContract = {
            role: dto.role,
            name: dto.name,
            phone: dto.phone,
            passwordHash,
            lang: DEFAULT_LANG,
            ...(dto.accountType !== undefined ? { accountType: dto.accountType } : {}),
        };
        const created = await this.users.createUser(data);
        // Онбординг владельца вендора: создаём сущность вендора в статусе pending
        // и привязываем vendorId к пользователю (попадёт в JWT при verifyOtp).
        if (this.vendors && created.role === Role.VendorOwner && created.vendorId === undefined) {
            const { vendorId } = await this.vendors.createForOwner(created.id);
            await this.users.setVendorId(created.id, vendorId);
        }

        await this.otp.request(dto.phone, 'verify');
        return { otpSent: true };
    }

    /** Подтверждение телефона: проверяет OTP, помечает телефон и выдаёт токены. */
    async verifyOtp(dto: VerifyOtpDto): Promise<VerifyOtpResult> {
        await this.otp.verify(dto.phone, 'verify', dto.code);

        const user = await this.users.findByPhone(dto.phone);
        if (!user) {
            throw new NotFoundException('errors.notFound');
        }

        await this.users.markPhoneVerified(user.id);

        const payload: JwtPayload = {
            sub: user.id,
            role: user.role,
            permissions: user.permissions ?? DEFAULT_ROLE_PERMISSIONS[user.role],
            ...(user.vendorId !== undefined ? { vendorId: user.vendorId } : {}),
        };
        if (dto.deviceId) {
            this.rememberDevice(user.id, dto.deviceId);
        }
        const tokens = await this.tokens.issueTokens(payload);
        return { tokens };
    }

    /** Вход по паролю с опциональным OTP при новом устройстве. */
    async login(dto: LoginDto): Promise<LoginResult> {
        const user = await this.users.findByPhone(dto.phone);
        if (!user) {
            throw new UnauthorizedException('errors.auth.invalidCredentials');
        }
        if (user.status === UserStatus.Blocked) {
            throw new ForbiddenException('errors.auth.blocked');
        }
        if (!user.phoneVerified) {
            throw new ForbiddenException('errors.auth.phoneNotVerified');
        }

        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) {
            throw new UnauthorizedException('errors.auth.invalidCredentials');
        }

        if (this.requireDeviceOtp && !this.isKnownDevice(user.id, dto.deviceId)) {
            await this.otp.request(dto.phone, 'verify', user.lang);
            return { otpRequired: true };
        }

        if (dto.deviceId) {
            this.rememberDevice(user.id, dto.deviceId);
        }

        const payload: JwtPayload = {
            sub: user.id,
            role: user.role,
            permissions: user.permissions ?? DEFAULT_ROLE_PERMISSIONS[user.role],
            ...(user.vendorId !== undefined ? { vendorId: user.vendorId } : {}),
        };
        const tokens = await this.tokens.issueTokens(payload);
        return { tokens };
    }

    /** Обновление пары токенов с ротацией refresh. */
    async refresh(dto: RefreshDto): Promise<RefreshResult> {
        const tokens = await this.tokens.rotate(dto.refreshToken);
        return { tokens };
    }

    /** Запрос сброса пароля: отправляет OTP, не раскрывая наличие пользователя. */
    async forgot(dto: ForgotDto): Promise<ForgotResult> {
        const user = await this.users.findByPhone(dto.phone);
        if (user) {
            await this.otp.request(dto.phone, 'reset', user.lang);
        }
        return { otpSent: true };
    }

    /** Сброс пароля по OTP. */
    async reset(dto: ResetDto): Promise<ResetResult> {
        await this.otp.verify(dto.phone, 'reset', dto.code);

        const user = await this.users.findByPhone(dto.phone);
        if (!user) {
            throw new NotFoundException('errors.notFound');
        }

        const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
        await this.users.updatePassword(user.id, passwordHash);
        return { success: true };
    }

    private rememberDevice(userId: string, deviceId: string): void {
        const set = this.knownDevices.get(userId) ?? new Set<string>();
        set.add(deviceId);
        this.knownDevices.set(userId, set);
    }

    private isKnownDevice(userId: string, deviceId: string | undefined): boolean {
        if (!deviceId) {
            return false;
        }
        return this.knownDevices.get(userId)?.has(deviceId) ?? false;
    }
}
