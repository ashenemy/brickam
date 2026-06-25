import { resolve } from 'node:path';
import { AuthModule } from '@brickam/auth';
import { ConfigKitModule } from '@brickam/config-kit';
import {
    AuditServiceContract,
    type CreateUserContract,
    NotificationsServiceContract,
    type TemplateVars,
    type UserContract,
    UserStatus,
    UsersServiceContract,
    VendorsServiceContract,
} from '@brickam/domain-kit';
import { I18nKitModule } from '@brickam/i18n-kit';
import {
    PagesAdminController,
    PagesController,
    PagesRepository,
    PagesService,
} from '@brickam/pages';
import { ServerKitModule } from '@brickam/server-kit';
import { Global, type INestApplication, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/** Пользователи БЕЗ vendorId на createUser — чтобы сработал онбординг через контракт. */
@Injectable()
class InMemoryUsers extends UsersServiceContract {
    private seq = 0;
    readonly byId = new Map<string, UserContract>();
    async findByPhone(phone: string) {
        return [...this.byId.values()].find((u) => u.phone === phone) ?? null;
    }
    async findById(id: string) {
        return this.byId.get(id) ?? null;
    }
    async createUser(d: CreateUserContract): Promise<UserContract> {
        this.seq += 1;
        const id = String(this.seq);
        const u: UserContract = {
            id,
            role: d.role,
            name: d.name,
            phone: d.phone,
            passwordHash: d.passwordHash,
            phoneVerified: false,
            lang: 'hy',
            status: UserStatus.Active,
        };
        this.byId.set(id, u);
        return u;
    }
    async markPhoneVerified(id: string) {
        const u = this.byId.get(id);
        if (u) {
            u.phoneVerified = true;
        }
    }
    async updatePassword() {}
    async setVendorId(userId: string, vendorId: string) {
        const u = this.byId.get(userId);
        if (u) {
            u.vendorId = vendorId;
        }
    }
}

@Injectable()
class InMemoryNotifications extends NotificationsServiceContract {
    readonly codes = new Map<string, string>();
    async sendSms(recipient: string, _k: string, _l: string, vars: TemplateVars) {
        this.codes.set(recipient, String(vars['code']));
    }
    async sendEmail() {}
}

@Injectable()
class FakeVendors extends VendorsServiceContract {
    async createForOwner() {
        return { vendorId: 'v-onb' };
    }
    async setRating() {}
}

@Global()
@Module({
    providers: [
        { provide: UsersServiceContract, useClass: InMemoryUsers },
        { provide: NotificationsServiceContract, useClass: InMemoryNotifications },
        { provide: VendorsServiceContract, useClass: FakeVendors },
        { provide: AuditServiceContract, useValue: { record: async () => {} } },
    ],
    exports: [
        UsersServiceContract,
        NotificationsServiceContract,
        VendorsServiceContract,
        AuditServiceContract,
    ],
})
class FakeDeps {}

@Injectable()
class FakePagesRepo {
    private seq = 0;
    private readonly bySlug = new Map<string, Record<string, unknown>>();
    async findBySlug(slug: string) {
        return this.bySlug.get(slug) ?? null;
    }
    async findPublished() {
        return [...this.bySlug.values()].filter((p) => p['status'] === 'published');
    }
    async find() {
        return [...this.bySlug.values()];
    }
    async create(data: Record<string, unknown>) {
        this.seq += 1;
        const id = String(this.seq);
        const doc = { ...data, id, _id: { toString: () => id } };
        this.bySlug.set(data['slug'] as string, doc);
        return doc;
    }
    async updateById(id: string, patch: Record<string, unknown>) {
        const doc = [...this.bySlug.values()].find((d) => d['id'] === id);
        if (doc) {
            Object.assign(doc, patch);
        }
        return doc ?? null;
    }
}

@Module({
    controllers: [PagesController, PagesAdminController],
    providers: [PagesService, { provide: PagesRepository, useClass: FakePagesRepo }],
})
class PagesTestModule {}

const testEnv = {
    MONGO_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'e2e-access',
    JWT_REFRESH_SECRET: 'e2e-refresh',
};

describe('Follow-ups e2e (онбординг вендора, CMS-страницы)', () => {
    let app: INestApplication;
    let http: ReturnType<typeof request>;
    let adminToken: string;
    const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });

    const register = async (phone: string, role: string) => {
        const notifications = app.get(
            NotificationsServiceContract,
        ) as unknown as InMemoryNotifications;
        await http
            .post('/api/auth/register')
            .send({ phone, password: 'Password123', name: role, role });
        const verify = await http
            .post('/api/auth/verify-otp')
            .send({ phone, code: notifications.codes.get(phone) });
        return verify.body.data.tokens.accessToken as string;
    };

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                ConfigKitModule.forRoot({
                    env: testEnv,
                    configDir: resolve(import.meta.dirname, '../../../../config'),
                }),
                I18nKitModule,
                ServerKitModule.forRoot(),
                FakeDeps,
                AuthModule,
                PagesTestModule,
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
        http = request(app.getHttpServer());
        adminToken = await register('+37410000100', 'admin');
    });

    afterAll(async () => {
        await app?.close();
    });

    it('онбординг: регистрация vendor_owner создаёт вендора и привязывает vendorId', async () => {
        await register('+37410000101', 'vendor_owner');
        const users = app.get(UsersServiceContract) as unknown as InMemoryUsers;
        const owner = await users.findByPhone('+37410000101');
        expect(owner?.vendorId).toBe('v-onb');
    });

    it('страницы: админ публикует страницу → публичное чтение', async () => {
        const put = await http
            .put('/api/admin/pages/about')
            .set(bearer(adminToken))
            .send({
                title: { hy: 'Մեր մասին', ru: 'О нас', en: 'About' },
                content: { hy: 'բովանդակություն', ru: 'Контент', en: 'Content' },
                status: 'published',
            });
        expect([200, 201]).toContain(put.status);

        const pub = await http.get('/api/pages/about');
        expect(pub.status).toBe(200);
        expect(pub.body.data.title.ru).toBe('О нас');
    });

    it('страницы: не-админ не может править (403)', async () => {
        const buyerToken = await register('+37410000102', 'buyer');
        const res = await http
            .put('/api/admin/pages/terms')
            .set(bearer(buyerToken))
            .send({ title: { hy: 'x', ru: 'x', en: 'x' }, content: { hy: 'x', ru: 'x', en: 'x' } });
        expect(res.status).toBe(403);
    });
});
