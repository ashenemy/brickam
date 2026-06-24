import { resolve } from 'node:path';
import { AuthModule } from '@brickam/auth';
import { ConfigKitModule } from '@brickam/config-kit';
import {
    type CreateUserContract,
    NotificationsServiceContract,
    Permission,
    type TemplateVars,
    type UserContract,
    UserStatus,
    UsersServiceContract,
} from '@brickam/domain-kit';
import { I18nKitModule } from '@brickam/i18n-kit';
import { Auth, CurrentUser, ServerKitModule } from '@brickam/server-kit';
import { Controller, Get, Global, type INestApplication, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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

/** Фейковые уведомления: вместо отправки SMS запоминают OTP-код по телефону. */
@Injectable()
class InMemoryNotifications extends NotificationsServiceContract {
    readonly codes = new Map<string, string>();

    async sendSms(
        recipient: string,
        _key: string,
        _lang: string,
        vars: TemplateVars,
    ): Promise<void> {
        this.codes.set(recipient, String(vars['code']));
    }

    async sendEmail(): Promise<void> {
        // не используется в этих тестах
    }
}

@Global()
@Module({
    providers: [
        { provide: UsersServiceContract, useClass: InMemoryUsersService },
        { provide: NotificationsServiceContract, useClass: InMemoryNotifications },
    ],
    exports: [UsersServiceContract, NotificationsServiceContract],
})
class FakeDepsModule {}

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

describe('Auth e2e (in-process, OTP через notifications-контракт, без Mongo)', () => {
    let app: INestApplication;
    let http: ReturnType<typeof request>;
    let notifications: InMemoryNotifications;

    const phone = '+37410000001';
    const password = 'Password123';

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                ConfigKitModule.forRoot({
                    env: testEnv,
                    configDir: resolve(import.meta.dirname, '../../../../config'),
                }),
                I18nKitModule,
                ServerKitModule.forRoot(),
                FakeDepsModule,
                AuthModule,
                ProbeModule,
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
        http = request(app.getHttpServer());
        notifications = app.get(NotificationsServiceContract);
    });

    afterAll(async () => {
        await app?.close();
    });

    const otpFor = (target: string): string => {
        const code = notifications.codes.get(target);
        if (!code) {
            throw new Error(`OTP-код не отправлен для ${target}`);
        }
        return code;
    };

    it('полный цикл: register → verify → login → refresh', async () => {
        const reg = await http
            .post('/api/auth/register')
            .send({ phone, password, name: 'Test Buyer', role: 'buyer' });
        expect(reg.status).toBe(201);
        expect(reg.body).toEqual({ success: true, data: { otpSent: true } });

        const verify = await http.post('/api/auth/verify-otp').send({ phone, code: otpFor(phone) });
        expect(verify.status).toBe(200);
        expect(verify.body.data.tokens.accessToken).toBeTruthy();
        expect(verify.body.data.tokens.refreshToken).toBeTruthy();

        const login = await http.post('/api/auth/login').send({ phone, password });
        expect(login.status).toBe(200);
        const refreshToken = login.body.data.tokens.refreshToken as string;
        expect(refreshToken).toBeTruthy();

        const refreshed = await http.post('/api/auth/refresh').send({ refreshToken });
        expect(refreshed.status).toBe(200);
        expect(refreshed.body.data.tokens.refreshToken).toBeTruthy();
        expect(refreshed.body.data.tokens.refreshToken).not.toBe(refreshToken);

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
        const verify = await http
            .post('/api/auth/verify-otp')
            .send({ phone: vphone, code: otpFor(vphone) });
        const access = verify.body.data.tokens.accessToken as string;
        const ok = await http.get('/api/vendor-only').set('Authorization', `Bearer ${access}`);
        expect(ok.status).toBe(200);
    });
});
