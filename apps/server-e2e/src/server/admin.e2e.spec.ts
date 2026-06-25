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
} from '@brickam/domain-kit';
import { I18nKitModule } from '@brickam/i18n-kit';
import {
    LoyaltyAdminController,
    LoyaltyLedgerRepository,
    LoyaltyProgramsRepository,
    LoyaltyService,
} from '@brickam/loyalty';
import { ServerKitModule } from '@brickam/server-kit';
import {
    TemplateRenderer,
    TemplatesAdminController,
    TemplatesRepository,
    TemplatesService,
} from '@brickam/templates';
import { Global, type INestApplication, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

@Injectable()
class InMemoryUsers extends UsersServiceContract {
    private seq = 0;
    private readonly byId = new Map<string, UserContract>();
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
}

@Injectable()
class InMemoryNotifications extends NotificationsServiceContract {
    readonly codes = new Map<string, string>();
    async sendSms(recipient: string, _k: string, _l: string, vars: TemplateVars) {
        this.codes.set(recipient, String(vars['code']));
    }
    async sendEmail() {}
}

@Global()
@Module({
    providers: [
        { provide: UsersServiceContract, useClass: InMemoryUsers },
        { provide: NotificationsServiceContract, useClass: InMemoryNotifications },
        { provide: AuditServiceContract, useValue: { record: async () => {} } },
    ],
    exports: [UsersServiceContract, NotificationsServiceContract, AuditServiceContract],
})
class FakeDeps {}

@Injectable()
class FakeTemplatesRepo {
    private seq = 0;
    private readonly byKey = new Map<string, Record<string, unknown>>();
    async findByKey(key: string) {
        return this.byKey.get(key) ?? null;
    }
    async create(data: Record<string, unknown>) {
        this.seq += 1;
        const id = String(this.seq);
        const doc = { ...data, id, _id: { toString: () => id } };
        this.byKey.set(data['key'] as string, doc);
        return doc;
    }
    async updateById(id: string, patch: Record<string, unknown>) {
        const doc = [...this.byKey.values()].find((d) => d['id'] === id);
        if (doc) {
            Object.assign(doc, patch);
        }
        return doc ?? null;
    }
    async find() {
        return [...this.byKey.values()];
    }
}

type Program = {
    id: string;
    _id: { toString: () => string };
    basis: string;
    active: boolean;
    tiers: Array<Record<string, unknown>>;
};

@Injectable()
class FakeProgramsRepo {
    private seq = 0;
    private readonly all: Program[] = [];
    async create(data: Record<string, unknown>) {
        this.seq += 1;
        const id = String(this.seq);
        const doc: Program = {
            id,
            _id: { toString: () => id },
            basis: data['basis'] as string,
            active: (data['active'] as boolean) ?? false,
            tiers: data['tiers'] as Array<Record<string, unknown>>,
        };
        this.all.push(doc);
        return doc;
    }
    async findActive() {
        return this.all.find((p) => p.active) ?? null;
    }
    async findAllPrograms() {
        return this.all;
    }
    async deactivateAll() {
        for (const p of this.all) {
            p.active = false;
        }
    }
    async setActive(id: string, active: boolean) {
        const p = this.all.find((x) => x.id === id);
        if (p) {
            p.active = active;
        }
        return p ?? null;
    }
    async updateById(id: string, patch: Record<string, unknown>) {
        const p = this.all.find((x) => x.id === id);
        if (p) {
            Object.assign(p, patch);
        }
        return p ?? null;
    }
}

@Module({
    controllers: [TemplatesAdminController, LoyaltyAdminController],
    providers: [
        TemplatesService,
        TemplateRenderer,
        { provide: TemplatesRepository, useClass: FakeTemplatesRepo },
        LoyaltyService,
        { provide: LoyaltyProgramsRepository, useClass: FakeProgramsRepo },
        { provide: LoyaltyLedgerRepository, useValue: { create: async () => ({}) } },
    ],
})
class AdminTestModule {}

const testEnv = {
    MONGO_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'e2e-access',
    JWT_REFRESH_SECRET: 'e2e-refresh',
};

describe('Admin e2e (гейт роли, редактор шаблонов→рендер, конструктор лояльности→применение)', () => {
    let app: INestApplication;
    let http: ReturnType<typeof request>;
    let adminToken: string;
    let buyerToken: string;
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
                AdminTestModule,
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
        http = request(app.getHttpServer());

        adminToken = await register('+37410000090', 'admin');
        buyerToken = await register('+37410000091', 'buyer');
    });

    afterAll(async () => {
        await app?.close();
    });

    it('гейт роли: не-админ получает 403 на админ-эндпоинте', async () => {
        const res = await http.get('/api/admin/templates').set(bearer(buyerToken));
        expect(res.status).toBe(403);
    });

    it('редактирование шаблона → рендер новых текстов с подстановкой', async () => {
        const put = await http
            .put('/api/admin/templates/welcome')
            .set(bearer(adminToken))
            .send({
                type: 'sms',
                variables: ['name'],
                content: { hy: 'Բարև {{name}}', ru: 'Привет {{name}}', en: 'Hi {{name}}' },
            });
        expect([200, 201]).toContain(put.status);

        const preview = await http
            .post('/api/admin/templates/welcome/preview')
            .set(bearer(adminToken))
            .send({ lang: 'ru', vars: { name: 'Вася' } });
        expect(preview.status).toBe(201);
        expect(preview.body.data.body).toBe('Привет Вася');
    });

    it('конструктор лояльности → активация → скидка применяется к покупателю', async () => {
        const created = await http
            .post('/api/admin/loyalty/programs')
            .set(bearer(adminToken))
            .send({
                basis: 'total_spend',
                tiers: [
                    {
                        level: 1,
                        name: 'Start',
                        threshold: 0,
                        discountType: 'percent',
                        discountValue: 10,
                    },
                ],
            });
        expect(created.status).toBe(201);
        const programId = created.body.data.id ?? created.body.data._id;

        const activate = await http
            .post(`/api/admin/loyalty/programs/${programId}/activate`)
            .set(bearer(adminToken))
            .send();
        expect([200, 201]).toContain(activate.status);

        // активированная программа применяется: скидка 10% от 1000 = 100
        const preview = await (app.get(LoyaltyService) as LoyaltyService).previewDiscount(
            'buyer-x',
            1000,
        );
        expect(preview.loyaltyDiscount).toBe(100);
    });
});
