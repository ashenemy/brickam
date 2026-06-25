import { resolve } from 'node:path';
import { AuthModule } from '@brickam/auth';
import { ConfigKitModule } from '@brickam/config-kit';
import {
    CatalogBulkContract,
    type CreateUserContract,
    type MemberAccess,
    NotificationsServiceContract,
    type ProductBulkView,
    type TemplateVars,
    type UserContract,
    UserStatus,
    UsersServiceContract,
} from '@brickam/domain-kit';
import { I18nKitModule } from '@brickam/i18n-kit';
import { ServerKitModule } from '@brickam/server-kit';
import { BULK_QUEUE, BulkController, BulkService } from '@brickam/vendor-bulk';
import {
    VendorMembersController,
    VendorMembersRepository,
    VendorMembersService,
} from '@brickam/vendor-members';
import { getQueueToken } from '@nestjs/bullmq';
import { Global, type INestApplication, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

/** Пользователи: vendor_owner получает vendorId; setMemberAccess пишет права. */
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
            ...(d.role === 'vendor_owner' ? { vendorId: 'v1' } : {}),
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
    async setMemberAccess(userId: string, access: MemberAccess) {
        const u = this.byId.get(userId);
        if (u) {
            u.role = access.role as UserContract['role'];
            u.vendorId = access.vendorId;
            u.permissions = access.permissions as UserContract['permissions'];
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

@Global()
@Module({
    providers: [
        { provide: UsersServiceContract, useClass: InMemoryUsers },
        { provide: NotificationsServiceContract, useClass: InMemoryNotifications },
    ],
    exports: [UsersServiceContract, NotificationsServiceContract],
})
class FakeAuthDeps {}

@Injectable()
class FakeMembersRepo {
    private readonly all: Array<Record<string, unknown>> = [];
    async findByVendorUser(vendorId: string, userId: string) {
        return this.all.find((m) => m['vendorId'] === vendorId && m['userId'] === userId) ?? null;
    }
    async findByVendor(vendorId: string) {
        return this.all.filter((m) => m['vendorId'] === vendorId);
    }
    async create(data: Record<string, unknown>) {
        const doc = { ...data, id: String(this.all.length + 1), _id: { toString: () => 'm' } };
        this.all.push(doc);
        return doc;
    }
    async updateById(_id: string, patch: Record<string, unknown>) {
        return patch;
    }
}

@Injectable()
class FakeCatalogBulk extends CatalogBulkContract {
    async listForBulk(): Promise<ProductBulkView[]> {
        return [];
    }
    async applyBulk() {
        return { modified: 0 };
    }
}

@Module({
    controllers: [VendorMembersController, BulkController],
    providers: [
        VendorMembersService,
        { provide: VendorMembersRepository, useClass: FakeMembersRepo },
        BulkService,
        { provide: CatalogBulkContract, useClass: FakeCatalogBulk },
        { provide: getQueueToken(BULK_QUEUE), useValue: { add: vi.fn() } },
    ],
})
class VendorTestModule {}

const testEnv = {
    MONGO_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'e2e-access',
    JWT_REFRESH_SECRET: 'e2e-refresh',
};

describe('Vendor sub-accounts e2e (права члена соблюдаются)', () => {
    let app: INestApplication;
    let http: ReturnType<typeof request>;
    let ownerToken: string;
    const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });
    const ownerPhone = '+37410000070';
    const memberPhone = '+37410000071';

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
                FakeAuthDeps,
                AuthModule,
                VendorTestModule,
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
        http = request(app.getHttpServer());

        ownerToken = await register(ownerPhone, 'vendor_owner');
        await register(memberPhone, 'buyer');
    });

    afterAll(async () => {
        await app?.close();
    });

    const previewBody = {
        productIds: ['p1'],
        op: { kind: 'status', status: 'hidden' },
    };

    it('владелец (products.manage) делает preview массовой операции', async () => {
        const res = await http
            .post('/api/vendor-bulk/preview')
            .set(bearer(ownerToken))
            .send(previewBody);
        expect(res.status).toBe(201);
        expect(res.body.data.affected).toBe(0);
    });

    it('член с правом только orders.view получает 403 на products.manage', async () => {
        // владелец добавляет члена с правом ТОЛЬКО orders.view
        const add = await http
            .post('/api/vendor-members')
            .set(bearer(ownerToken))
            .send({ phone: memberPhone, permissions: ['orders.view'] });
        expect(add.status).toBe(201);

        // член логинится заново — токен несёт назначенные права (orders.view) + vendorId
        const login = await http
            .post('/api/auth/login')
            .send({ phone: memberPhone, password: 'Password123' });
        const memberToken = login.body.data.tokens.accessToken;

        // products.manage-эндпоинт запрещён члену без этого права
        const res = await http
            .post('/api/vendor-bulk/preview')
            .set(bearer(memberToken))
            .send(previewBody);
        expect(res.status).toBe(403);
    });
});
