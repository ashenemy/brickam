import { resolve } from 'node:path';
import { AuthModule } from '@brickam/auth';
import { getCalculator } from '@brickam/calc-kit';
import { ProductsController, ProductsService } from '@brickam/catalog';
import { ConfigKitModule } from '@brickam/config-kit';
import {
    CatalogServiceContract,
    type CreateUserContract,
    NotificationsServiceContract,
    type TemplateVars,
    type UserContract,
    UserStatus,
    UsersServiceContract,
} from '@brickam/domain-kit';
import { I18nKitModule } from '@brickam/i18n-kit';
import { CartController, CartService, CartsRepository } from '@brickam/orders';
import { ServerKitModule } from '@brickam/server-kit';
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

const PAINT = {
    id: 'p-paint',
    vendorId: 'v1',
    categoryId: 'cat-paint',
    slug: 'paint-1',
    title: { hy: 'Ներկ', ru: 'Краска', en: 'Paint' },
    unit: 'L',
    price: 5000,
    finalPrice: 5000,
    stock: 100,
};

/** Фейк каталога: и поиск по категории (контроллер), и снимок (корзина). */
@Injectable()
class FakeCatalog {
    async search(query: { categoryId?: string }) {
        const data = !query.categoryId || query.categoryId === PAINT.categoryId ? [PAINT] : [];
        return {
            data,
            meta: {
                page: 1,
                pageSize: 20,
                total: data.length,
                totalPages: 1,
                hasNext: false,
                hasPrev: false,
            },
        };
    }
    async getProductSnapshot(productId: string) {
        return productId === PAINT.id
            ? {
                  id: PAINT.id,
                  vendorId: PAINT.vendorId,
                  title: PAINT.title,
                  unit: PAINT.unit,
                  price: PAINT.price,
                  stock: PAINT.stock,
              }
            : null;
    }
    async decrementStock() {}
    async setProductRating() {}
}

type CartDoc = {
    buyerId: string;
    items: Array<Record<string, unknown>>;
    save: () => Promise<void>;
};

@Injectable()
class FakeCartsRepo {
    private readonly byBuyer = new Map<string, CartDoc>();
    async findByBuyer(buyerId: string) {
        return this.byBuyer.get(buyerId) ?? null;
    }
    async create(data: { buyerId: string; items: unknown[] }) {
        const doc: CartDoc = {
            buyerId: data.buyerId,
            items: data.items as Array<Record<string, unknown>>,
            save: async () => {},
        };
        this.byBuyer.set(data.buyerId, doc);
        return doc;
    }
}

@Module({
    controllers: [ProductsController, CartController],
    providers: [
        { provide: ProductsService, useClass: FakeCatalog },
        { provide: CatalogServiceContract, useExisting: ProductsService },
        CartService,
        { provide: CartsRepository, useClass: FakeCartsRepo },
    ],
})
class CalcFlowModule {}

const testEnv = {
    MONGO_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'e2e-access',
    JWT_REFRESH_SECRET: 'e2e-refresh',
};

describe('Calculators e2e (посчитал → подобрал по категории → в корзину)', () => {
    let app: INestApplication;
    let http: ReturnType<typeof request>;
    let token: string;

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
                CalcFlowModule,
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
        http = request(app.getHttpServer());

        const notifications = app.get(
            NotificationsServiceContract,
        ) as unknown as InMemoryNotifications;
        const phone = '+37410000050';
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

    it('калькулятор краски считает, его категория ведёт к товарам, товар уходит в корзину', async () => {
        // 1. посчитал (calc-kit, чистая логика)
        const paint = getCalculator('paint');
        const result = paint?.calculate({ area: 50 });
        expect(result?.quantity).toBe(10.5);
        expect(result?.packages).toBe(5);
        expect(result?.categorySlug).toBe('paint');

        // 2. подобрал товары категории (фильтр каталога по категории калькулятора)
        const list = await http.get('/api/catalog/products?categoryId=cat-paint');
        expect(list.status).toBe(200);
        expect(list.text).toContain('p-paint');

        // 3. в корзину (qty = посчитанные упаковки)
        const add = await http
            .post('/api/cart/items')
            .set({ Authorization: `Bearer ${token}` })
            .send({ productId: 'p-paint', qty: result?.packages });
        expect(add.status).toBe(201);

        const cart = await http.get('/api/cart').set({ Authorization: `Bearer ${token}` });
        expect(cart.status).toBe(200);
        const items = cart.body.data.items as Array<{ productId: string; qty: number }>;
        expect(items.find((i) => i.productId === 'p-paint')?.qty).toBe(5);
    });

    it('категория без товаров возвращает пусто', async () => {
        const list = await http.get('/api/catalog/products?categoryId=cat-empty');
        expect(list.status).toBe(200);
        expect(list.text).not.toContain('p-paint');
    });
});
