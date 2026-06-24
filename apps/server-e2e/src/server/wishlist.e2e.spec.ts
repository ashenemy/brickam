import { resolve } from 'node:path';
import { AuthModule } from '@brickam/auth';
import { ConfigKitModule } from '@brickam/config-kit';
import {
    type CreateUserContract,
    NotificationsServiceContract,
    type TemplateVars,
    type UserContract,
    UserStatus,
    UsersServiceContract,
} from '@brickam/domain-kit';
import { I18nKitModule } from '@brickam/i18n-kit';
import { ServerKitModule } from '@brickam/server-kit';
import { WishlistController, WishlistRepository, WishlistService } from '@brickam/wishlist';
import { Global, type INestApplication, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

@Injectable()
class InMemoryUsersService extends UsersServiceContract {
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
        { provide: UsersServiceContract, useClass: InMemoryUsersService },
        { provide: NotificationsServiceContract, useClass: InMemoryNotifications },
    ],
    exports: [UsersServiceContract, NotificationsServiceContract],
})
class FakeAuthDeps {}

type WDoc = {
    id: string;
    _id: { toString: () => string };
    userId: string;
    items: Array<{ productId: string; addedAt: Date }>;
};

/** In-memory репозиторий вишлиста с поддержкой $push/$pull. */
@Injectable()
class FakeWishlistRepo {
    private seq = 0;
    private readonly byUser = new Map<string, WDoc>();
    async findByUser(userId: string) {
        return this.byUser.get(userId) ?? null;
    }
    async create(data: { userId: string; items: Array<{ productId: string; addedAt: Date }> }) {
        this.seq += 1;
        const id = String(this.seq);
        const doc: WDoc = {
            id,
            _id: { toString: () => id },
            userId: data.userId,
            items: [...data.items],
        };
        this.byUser.set(data.userId, doc);
        return doc;
    }
    async updateById(id: string, update: any) {
        const doc = [...this.byUser.values()].find((d) => d.id === id);
        if (!doc) {
            return null;
        }
        if (update.$push?.items) {
            doc.items.push(update.$push.items);
        }
        if (update.$pull?.items) {
            const pid = update.$pull.items.productId;
            doc.items = doc.items.filter((it) => it.productId !== pid);
        }
        return doc;
    }
}

@Module({
    controllers: [WishlistController],
    providers: [WishlistService, { provide: WishlistRepository, useClass: FakeWishlistRepo }],
})
class WishlistTestModule {}

const testEnv = {
    MONGO_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'e2e-access',
    JWT_REFRESH_SECRET: 'e2e-refresh',
};

describe('Wishlist e2e (идемпотентность, in-process, без Mongo)', () => {
    let app: INestApplication;
    let http: ReturnType<typeof request>;
    let token: string;
    const auth = () => ({ Authorization: `Bearer ${token}` });

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
                WishlistTestModule,
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
        http = request(app.getHttpServer());

        const notifications = app.get(
            NotificationsServiceContract,
        ) as unknown as InMemoryNotifications;
        const phone = '+37410000020';
        await http
            .post('/api/auth/register')
            .send({ phone, password: 'Password123', name: 'Buyer', role: 'buyer' });
        const verify = await http
            .post('/api/auth/verify-otp')
            .send({ phone, code: notifications.codes.get(phone) });
        token = verify.body.data.tokens.accessToken;
    });

    afterAll(async () => {
        await app?.close();
    });

    it('без токена → 401', async () => {
        const res = await http.get('/api/wishlist');
        expect(res.status).toBe(401);
    });

    it('add идемпотентен: дубль не растит счётчик', async () => {
        const empty = await http.get('/api/wishlist').set(auth());
        expect(empty.body.data.count).toBe(0);

        const a1 = await http.post('/api/wishlist/items').set(auth()).send({ productId: 'p1' });
        expect(a1.body.data.count).toBe(1);

        const a2 = await http.post('/api/wishlist/items').set(auth()).send({ productId: 'p1' });
        expect(a2.body.data.count).toBe(1); // без дубля

        const a3 = await http.post('/api/wishlist/items').set(auth()).send({ productId: 'p2' });
        expect(a3.body.data.count).toBe(2);
    });

    it('remove идемпотентен и обновляет счётчик', async () => {
        const r1 = await http.delete('/api/wishlist/items/p1').set(auth());
        expect(r1.body.data.count).toBe(1);
        expect(r1.body.data.items.map((i: { productId: string }) => i.productId)).toEqual(['p2']);

        const r2 = await http.delete('/api/wishlist/items/p1').set(auth());
        expect(r2.body.data.count).toBe(1); // повторный remove не падает
    });
});
