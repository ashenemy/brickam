import { resolve } from 'node:path';
import { AuthModule } from '@brickam/auth';
import { ConfigKitModule } from '@brickam/config-kit';
import {
    CatalogServiceContract,
    type CreatePaymentInput,
    type CreateUserContract,
    NotificationsServiceContract,
    PaymentStatus,
    PaymentsServiceContract,
    type ProductSnapshot,
    type TemplateVars,
    type UserContract,
    UserStatus,
    UsersServiceContract,
} from '@brickam/domain-kit';
import { I18nKitModule } from '@brickam/i18n-kit';
import {
    CartsRepository,
    DeliveryAddressesRepository,
    OrdersController,
    OrdersRepository,
    OrdersService,
    VendorOrdersRepository,
} from '@brickam/orders';
import { ServerKitModule } from '@brickam/server-kit';
import { Global, type INestApplication, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// ── auth-фейки (для токена покупателя + глобальных guard'ов) ──
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

// ── состояние корзины (меняется в тестах) ──
let cartItems: Array<{
    productId: string;
    vendorId: string;
    qty: number;
    priceSnapshot: number;
    discountSnapshot?: { type: 'percent' | 'amount'; value: number };
}> = [];

const SNAPSHOTS: Record<string, ProductSnapshot> = {
    p1: {
        id: 'p1',
        vendorId: 'v1',
        title: { hy: 'A', ru: 'A', en: 'A' },
        unit: 'bag',
        price: 1000,
        stock: 10,
    },
    p2: {
        id: 'p2',
        vendorId: 'v2',
        title: { hy: 'B', ru: 'B', en: 'B' },
        unit: 'pcs',
        price: 500,
        stock: 10,
        discount: { type: 'percent', value: 20 },
    },
};

const decrementStock = vi.fn(async () => {});
const createForOrder = vi.fn(async (_i: CreatePaymentInput) => ({
    paymentId: 'pay1',
    status: PaymentStatus.Pending,
}));

@Injectable()
class FakeCatalog extends CatalogServiceContract {
    async getProductSnapshot(id: string) {
        return SNAPSHOTS[id] ?? null;
    }
    decrementStock = decrementStock;
    async setProductRating() {}
}

@Injectable()
class FakePayments extends PaymentsServiceContract {
    createForOrder = createForOrder;
    async confirm() {
        return { paymentId: 'pay1', status: PaymentStatus.Succeeded };
    }
    async getByOrder() {
        return { id: 'pay1', status: PaymentStatus.Succeeded };
    }
}

const fakeCart = {
    findByBuyer: vi.fn(async () => (cartItems.length ? { id: 'cart1', items: cartItems } : null)),
    updateById: vi.fn(async () => ({})),
};
const fakeOrders = {
    create: vi.fn(async (d: Record<string, unknown>) => ({
        ...d,
        id: 'order1',
        _id: { toString: () => 'order1' },
    })),
    updateById: vi.fn(async (id: string, patch: Record<string, unknown>) => ({
        id,
        _id: { toString: () => id },
        ...lastCreatedOrder,
        ...patch,
    })),
    findById: vi.fn(async () => null),
};
let lastCreatedOrder: Record<string, unknown> = {};
fakeOrders.create.mockImplementation(async (d: Record<string, unknown>) => {
    lastCreatedOrder = d;
    return { ...d, id: 'order1', _id: { toString: () => 'order1' } };
});
const fakeVendorOrders = {
    create: vi.fn(async (d: Record<string, unknown>) => ({
        ...d,
        id: 'vo',
        _id: { toString: () => 'vo' },
        deliveryStatus: 'accepted',
        deliveryEvents: [],
    })),
};

@Module({
    controllers: [OrdersController],
    providers: [
        OrdersService,
        { provide: CartsRepository, useValue: fakeCart },
        { provide: OrdersRepository, useValue: fakeOrders },
        { provide: VendorOrdersRepository, useValue: fakeVendorOrders },
        { provide: DeliveryAddressesRepository, useValue: {} },
        { provide: CatalogServiceContract, useClass: FakeCatalog },
        { provide: PaymentsServiceContract, useClass: FakePayments },
    ],
})
class OrdersTestModule {}

const testEnv = {
    MONGO_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'e2e-access',
    JWT_REFRESH_SECRET: 'e2e-refresh',
};

const address = {
    label: 'Home',
    region: 'Yerevan',
    city: 'Yerevan',
    line1: 'Mashtots 1',
    phone: '+37410000010',
};

describe('Orders e2e (checkout→split, in-process, без Mongo)', () => {
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
                OrdersTestModule,
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
        http = request(app.getHttpServer());

        // получаем токен покупателя
        const notifications = app.get(
            NotificationsServiceContract,
        ) as unknown as InMemoryNotifications;
        const phone = '+37410000010';
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

    beforeEach(() => {
        cartItems = [
            { productId: 'p1', vendorId: 'v1', qty: 2, priceSnapshot: 1000 },
            {
                productId: 'p2',
                vendorId: 'v2',
                qty: 1,
                priceSnapshot: 500,
                discountSnapshot: { type: 'percent', value: 20 },
            },
        ];
        decrementStock.mockClear();
        createForOrder.mockClear();
    });

    it('checkout без токена → 401', async () => {
        const res = await http.post('/api/auth/login'); // sanity: auth доступен
        expect([200, 400, 401, 422]).toContain(res.status);
        const co = await http.post('/api/orders/checkout').send({ deliveryAddress: address });
        expect(co.status).toBe(401);
    });

    it('checkout: один платёж разбит по вендорам, остатки списаны (§11)', async () => {
        const res = await http
            .post('/api/orders/checkout')
            .set('Authorization', `Bearer ${token}`)
            .send({ deliveryAddress: address });
        expect(res.status).toBe(201);
        const data = res.body.data;
        expect(data.order.total).toBe(2400);
        expect(data.order.subtotal).toBe(2500);
        expect(data.order.productDiscountTotal).toBe(100);
        expect(data.order.paymentId).toBe('pay1');
        expect(data.vendorOrders).toHaveLength(2);
        expect(data.splits).toHaveLength(2);
        const sum = data.splits.reduce((s: number, x: { amount: number }) => s + x.amount, 0);
        expect(sum).toBe(2400);
        // комиссия с продавца на сумму после скидки (7.5%)
        const v1 = data.splits.find((s: { vendorId: string }) => s.vendorId === 'v1');
        const v2 = data.splits.find((s: { vendorId: string }) => s.vendorId === 'v2');
        expect(v1).toMatchObject({ amount: 2000, commissionAmount: 150, payoutAmount: 1850 });
        expect(v2).toMatchObject({ amount: 400, commissionAmount: 30, payoutAmount: 370 });
        // остаток списан по каждой позиции, платёж создан на total
        expect(decrementStock).toHaveBeenCalledTimes(2);
        expect(createForOrder).toHaveBeenCalledWith(
            expect.objectContaining({ amount: 2400, orderId: 'order1' }),
        );
    });

    it('пустая корзина → 422', async () => {
        cartItems = [];
        const res = await http
            .post('/api/orders/checkout')
            .set('Authorization', `Bearer ${token}`)
            .send({ deliveryAddress: address });
        expect(res.status).toBe(422);
        expect(res.body.error.code).toBe('VALIDATION_FAILED');
    });
});
