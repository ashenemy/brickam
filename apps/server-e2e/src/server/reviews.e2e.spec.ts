import { resolve } from 'node:path';
import { AuthModule } from '@brickam/auth';
import { ConfigKitModule } from '@brickam/config-kit';
import {
    CatalogServiceContract,
    type CreateUserContract,
    NotificationsServiceContract,
    OrdersServiceContract,
    type TemplateVars,
    type UserContract,
    UserStatus,
    UsersServiceContract,
    type VendorOrderForReview,
} from '@brickam/domain-kit';
import { I18nKitModule } from '@brickam/i18n-kit';
import { ReviewsController, ReviewsRepository, ReviewsService } from '@brickam/reviews';
import { ServerKitModule } from '@brickam/server-kit';
import { Global, type INestApplication, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

@Injectable()
class InMemoryUsersService extends UsersServiceContract {
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
}

@Injectable()
class InMemoryNotifications extends NotificationsServiceContract {
    readonly codes = new Map<string, string>();
    async sendSms(recipient: string, _k: string, _l: string, vars: TemplateVars) {
        this.codes.set(recipient, String(vars['code']));
    }
    async sendEmail() {}
}

let buyerId = '1';

@Injectable()
class FakeOrders extends OrdersServiceContract {
    async getVendorOrderForReview(id: string): Promise<VendorOrderForReview | null> {
        if (id === 'vo-done') {
            return {
                id,
                orderId: 'o1',
                vendorId: 'v1',
                buyerId,
                orderStatus: 'completed',
                productIds: ['p1'],
            };
        }
        if (id === 'vo-new') {
            return {
                id,
                orderId: 'o2',
                vendorId: 'v1',
                buyerId,
                orderStatus: 'created',
                productIds: ['p1'],
            };
        }
        return null;
    }
}

const setProductRating = vi.fn(async () => {});

@Injectable()
class FakeCatalog extends CatalogServiceContract {
    async getProductSnapshot() {
        return null;
    }
    async decrementStock() {}
    setProductRating = setProductRating;
}

type RDoc = {
    id: string;
    _id: { toString: () => string };
    vendorOrderId: string;
    vendorId: string;
    productId?: string;
    rating: number;
    text: string;
    status: string;
};

@Injectable()
class FakeReviewsRepo {
    private seq = 0;
    readonly all: RDoc[] = [];
    async findByVendorOrder(voId: string) {
        return this.all.find((r) => r.vendorOrderId === voId) ?? null;
    }
    async findPublishedByVendor(vendorId: string) {
        return this.all.filter((r) => r.vendorId === vendorId && r.status === 'published');
    }
    async findPublishedByProduct(productId: string) {
        return this.all.filter((r) => r.productId === productId && r.status === 'published');
    }
    async create(data: Record<string, unknown>) {
        this.seq += 1;
        const id = String(this.seq);
        const doc = {
            ...data,
            id,
            _id: { toString: () => id },
            status: (data['status'] as string) ?? 'published',
        } as RDoc;
        this.all.push(doc);
        return doc;
    }
    async updateById(id: string, patch: Record<string, unknown>) {
        const doc = this.all.find((r) => r.id === id);
        if (doc) {
            Object.assign(doc, patch);
        }
        return doc ?? null;
    }
}

@Module({
    controllers: [ReviewsController],
    providers: [
        ReviewsService,
        { provide: ReviewsRepository, useClass: FakeReviewsRepo },
        { provide: OrdersServiceContract, useClass: FakeOrders },
        { provide: CatalogServiceContract, useClass: FakeCatalog },
    ],
})
class ReviewsTestModule {}

@Global()
@Module({
    providers: [
        { provide: UsersServiceContract, useClass: InMemoryUsersService },
        { provide: NotificationsServiceContract, useClass: InMemoryNotifications },
    ],
    exports: [UsersServiceContract, NotificationsServiceContract],
})
class FakeAuthDeps {}

const testEnv = {
    MONGO_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'e2e-access',
    JWT_REFRESH_SECRET: 'e2e-refresh',
};

describe('Reviews e2e (только completed, без повторов, пересчёт)', () => {
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
                ReviewsTestModule,
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
        http = request(app.getHttpServer());

        const notifications = app.get(
            NotificationsServiceContract,
        ) as unknown as InMemoryNotifications;
        const users = app.get(UsersServiceContract) as unknown as InMemoryUsersService;
        const phone = '+37410000030';
        await http
            .post('/api/auth/register')
            .send({ phone, password: 'Password123', name: 'Buyer', role: 'buyer' });
        const verify = await http
            .post('/api/auth/verify-otp')
            .send({ phone, code: notifications.codes.get(phone) });
        token = verify.body.data.tokens.accessToken;
        buyerId = (await users.findByPhone(phone))?.id ?? '1';
    });

    afterAll(async () => {
        await app?.close();
    });

    it('отзыв без токена → 401', async () => {
        const res = await http
            .post('/api/reviews')
            .send({ vendorOrderId: 'vo-done', rating: 5, text: 'x' });
        expect(res.status).toBe(401);
    });

    it('по незавершённому заказу → 422', async () => {
        const res = await http
            .post('/api/reviews')
            .set(auth())
            .send({ vendorOrderId: 'vo-new', rating: 5, text: 'good', productId: 'p1' });
        expect(res.status).toBe(422);
    });

    it('по завершённому → 201, пересчёт рейтинга товара', async () => {
        const res = await http
            .post('/api/reviews')
            .set(auth())
            .send({ vendorOrderId: 'vo-done', rating: 5, text: 'great', productId: 'p1' });
        expect(res.status).toBe(201);
        expect(res.body.data.rating).toBe(5);
        expect(setProductRating).toHaveBeenCalledWith('p1', 5, 1);
    });

    it('повторный отзыв на тот же vendor_order → 409', async () => {
        const res = await http
            .post('/api/reviews')
            .set(auth())
            .send({ vendorOrderId: 'vo-done', rating: 4, text: 'again', productId: 'p1' });
        expect(res.status).toBe(409);
    });

    it('публичная сводка по товару/вендору', async () => {
        const product = await http.get('/api/reviews/product/p1');
        expect(product.status).toBe(200);
        expect(product.body.data.ratingAvg).toBe(5);
        expect(product.body.data.ratingCount).toBe(1);

        const vendor = await http.get('/api/reviews/vendor/v1');
        expect(vendor.status).toBe(200);
        expect(vendor.body.data.ratingCount).toBe(1);
    });
});
