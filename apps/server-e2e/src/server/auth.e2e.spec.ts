import { resolve } from 'node:path';
import { AuthModule } from '@brickam/auth';
import { ConfigKitModule } from '@brickam/config-kit';
import {
    type CreateUserContract,
    Permission,
    type UserContract,
    UserStatus,
    UsersServiceContract,
} from '@brickam/domain-kit';
import { I18nKitModule } from '@brickam/i18n-kit';
import { Auth, CurrentUser, ServerKitModule } from '@brickam/server-kit';
import {
    Controller,
    Get,
    Global,
    type INestApplication,
    Injectable,
    Logger,
    Module,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

/** In-memory реализация контракта users (e2e без Mongo). */
@Injectable()
class InMemoryUsersService extends UsersServiceContract {
    private seq = 0;
    private readonly byId = new Map<string, UserContract>();

    async findByPhone(phone: string): Promise<UserContract | null> {
        for (const user of this.byId.values()) {
            if (user.phone === phone) {
                return user;
            }
        }
        return null;
    }

    async findById(id: string): Promise<UserContract | null> {
        return this.byId.get(id) ?? null;
    }

    async createUser(data: CreateUserContract): Promise<UserContract> {
        this.seq += 1;
        const id = String(this.seq);
        const user: UserContract = {
            id,
            role: data.role,
            name: data.name,
            phone: data.phone,
            passwordHash: data.passwordHash,
            phoneVerified: false,
            lang: data.lang ?? 'hy',
            status: UserStatus.Active,
            ...(data.accountType !== undefined ? { accountType: data.accountType } : {}),
        };
        this.byId.set(id, user);
        return user;
    }

    async markPhoneVerified(id: string): Promise<void> {
        const user = this.byId.get(id);
        if (user) {
            user.phoneVerified = true;
        }
    }

    async updatePassword(id: string, passwordHash: string): Promise<void> {
        const user = this.byId.get(id);
        if (user) {
            user.passwordHash = passwordHash;
        }
    }
}

@Global()
@Module({
    providers: [{ provide: UsersServiceContract, useClass: InMemoryUsersService }],
    exports: [UsersServiceContract],
})
class FakeUsersModule {}

/** Защищённые маршруты для проверки guard'ов. */
@Controller()
class ProbeController {
    @Get('me-protected')
    @Auth()
    me(@CurrentUser('id') id: string) {
        return { id };
    }

    @Get('vendor-only')
    @Auth(Permission.ProductsManage)
    vendorOnly() {
        return { ok: true };
    }
}

@Module({ controllers: [ProbeController] })
class ProbeModule {}

const testEnv = {
    MONGO_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'e2e-access-secret',
    JWT_REFRESH_SECRET: 'e2e-refresh-secret',
};

/** Достаёт OTP-код из мок-SMS лога OtpService. */
function captureOtp(
    logSpy: ReturnType<typeof vi.spyOn>,
    phone: string,
    purpose = 'verify',
): string {
    const re = new RegExp(`OTP for \\${phone} \\(${purpose}\\): (\\d+)`);
    for (const call of logSpy.mock.calls) {
        const msg = String(call[0]);
        const m = re.exec(msg);
        if (m) {
            return m[1];
        }
    }
    throw new Error(`OTP-код не найден в логах для ${phone}`);
}

describe('Auth e2e (in-process, мок-SMS, без Mongo)', () => {
    let app: INestApplication;
    let http: ReturnType<typeof request>;
    let logSpy: ReturnType<typeof vi.spyOn>;

    const phone = '+37410000001';
    const password = 'Password123';

    beforeAll(async () => {
        logSpy = vi.spyOn(Logger.prototype, 'log');
        const moduleRef = await Test.createTestingModule({
            imports: [
                ConfigKitModule.forRoot({
                    env: testEnv,
                    configDir: resolve(import.meta.dirname, '../../../../config'),
                }),
                I18nKitModule,
                ServerKitModule.forRoot(),
                FakeUsersModule,
                AuthModule,
                ProbeModule,
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
        http = request(app.getHttpServer());
    });

    afterAll(async () => {
        await app?.close();
        logSpy?.mockRestore();
    });

    it('полный цикл: register → verify → login → refresh', async () => {
        // register
        const reg = await http
            .post('/api/auth/register')
            .send({ phone, password, name: 'Test Buyer', role: 'buyer' });
        expect(reg.status).toBe(201);
        expect(reg.body).toEqual({ success: true, data: { otpSent: true } });

        // verify
        const code = captureOtp(logSpy, phone, 'verify');
        const verify = await http.post('/api/auth/verify-otp').send({ phone, code });
        expect(verify.status).toBe(200);
        expect(verify.body.data.tokens.accessToken).toBeTruthy();
        expect(verify.body.data.tokens.refreshToken).toBeTruthy();

        // login
        const login = await http.post('/api/auth/login').send({ phone, password });
        expect(login.status).toBe(200);
        const refreshToken = login.body.data.tokens.refreshToken as string;
        expect(refreshToken).toBeTruthy();

        // refresh (ротация)
        const refreshed = await http.post('/api/auth/refresh').send({ refreshToken });
        expect(refreshed.status).toBe(200);
        expect(refreshed.body.data.tokens.refreshToken).toBeTruthy();
        expect(refreshed.body.data.tokens.refreshToken).not.toBe(refreshToken);

        // старый refresh после ротации невалиден
        const reused = await http.post('/api/auth/refresh').send({ refreshToken });
        expect(reused.status).toBe(401);
    });

    it('негативы: неверный OTP → 422, дубликат телефона → 409', async () => {
        const dup = await http
            .post('/api/auth/register')
            .send({ phone, password, name: 'Dup', role: 'buyer' });
        expect(dup.status).toBe(409);
        expect(dup.body.error.code).toBe('CONFLICT');

        const phone2 = '+37410000002';
        await http
            .post('/api/auth/register')
            .send({ phone: phone2, password, name: 'B2', role: 'buyer' });
        const bad = await http.post('/api/auth/verify-otp').send({ phone: phone2, code: '000000' });
        expect(bad.status).toBe(422);
        expect(bad.body.error.code).toBe('VALIDATION_FAILED');
    });

    it('валидация DTO: некорректный телефон → 422', async () => {
        const res = await http
            .post('/api/auth/register')
            .send({ phone: '12345', password, name: 'X', role: 'buyer' });
        expect(res.status).toBe(422);
    });

    it('guard: защищённый маршрут без токена → 401, с токеном → 200', async () => {
        const noToken = await http.get('/api/me-protected');
        expect(noToken.status).toBe(401);

        const login = await http.post('/api/auth/login').send({ phone, password });
        const access = login.body.data.tokens.accessToken as string;
        const ok = await http.get('/api/me-protected').set('Authorization', `Bearer ${access}`);
        expect(ok.status).toBe(200);
        expect(ok.body.data.id).toBeTruthy();
    });

    it('permissions guard: покупатель без права → 403', async () => {
        const login = await http.post('/api/auth/login').send({ phone, password });
        const access = login.body.data.tokens.accessToken as string;
        const forbidden = await http
            .get('/api/vendor-only')
            .set('Authorization', `Bearer ${access}`);
        expect(forbidden.status).toBe(403);
        expect(forbidden.body.error.code).toBe('FORBIDDEN');
    });

    it('permissions guard: vendor_owner с правом → 200', async () => {
        const vphone = '+37410000003';
        await http
            .post('/api/auth/register')
            .send({ phone: vphone, password, name: 'Vendor', role: 'vendor_owner' });
        const code = captureOtp(logSpy, vphone, 'verify');
        const verify = await http.post('/api/auth/verify-otp').send({ phone: vphone, code });
        const access = verify.body.data.tokens.accessToken as string;
        const ok = await http.get('/api/vendor-only').set('Authorization', `Bearer ${access}`);
        expect(ok.status).toBe(200);
    });
});
