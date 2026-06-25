import { resolve } from 'node:path';
import { ConfigKitModule } from '@brickam/config-kit';
import {
    CatalogServiceContract,
    type CreatePaymentInput,
    type LoyaltyMetric,
    LoyaltyServiceContract,
    type LoyaltyUpdate,
    OrderStatus,
    PaymentStatus,
    PaymentsServiceContract,
    type ProductSnapshot,
    UsersServiceContract,
} from '@brickam/domain-kit';
import {
    LoyaltyLedgerRepository,
    LoyaltyProgramsRepository,
    LoyaltyService,
} from '@brickam/loyalty';
import {
    CartsRepository,
    DeliveryAddressesRepository,
    OrdersRepository,
    OrdersService,
    VendorOrdersRepository,
} from '@brickam/orders';
import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const BUYER = 'buyer1';

const SNAPSHOTS: Record<string, ProductSnapshot> = {
    p1: {
        id: 'p1',
        vendorId: 'v1',
        title: { hy: 'A', ru: 'A', en: 'A' },
        unit: 'bag',
        price: 1000,
        stock: 100,
    },
    p2: {
        id: 'p2',
        vendorId: 'v2',
        title: { hy: 'B', ru: 'B', en: 'B' },
        unit: 'pcs',
        price: 500,
        stock: 100,
        discount: { type: 'percent', value: 20 },
    },
};

/** Пользователи со стейтом лояльности (users.loyalty). */
@Injectable()
class InMemoryUsers extends UsersServiceContract {
    private readonly loyalty = new Map<string, LoyaltyMetric>();
    async findByPhone() {
        return null;
    }
    async findById() {
        return null;
    }
    async createUser() {
        throw new Error('not used');
    }
    async markPhoneVerified() {}
    async updatePassword() {}
    async getLoyaltyMetric(userId: string): Promise<LoyaltyMetric> {
        return this.loyalty.get(userId) ?? { totalSpend: 0, totalOrders: 0 };
    }
    async updateLoyalty(userId: string, update: LoyaltyUpdate): Promise<void> {
        this.loyalty.set(userId, {
            totalSpend: update.totalSpend,
            totalOrders: update.totalOrders,
            ...(update.currentTierId !== undefined ? { currentTierId: update.currentTierId } : {}),
        });
    }
}

@Injectable()
class FakeCatalog extends CatalogServiceContract {
    async getProductSnapshot(id: string) {
        return SNAPSHOTS[id] ?? null;
    }
    async decrementStock() {}
    async setProductRating() {}
}

@Injectable()
class FakePayments extends PaymentsServiceContract {
    last?: CreatePaymentInput;
    async createForOrder(input: CreatePaymentInput) {
        this.last = input;
        return { paymentId: 'pay1', status: PaymentStatus.Pending };
    }
    async confirm() {
        return { paymentId: 'pay1', status: PaymentStatus.Succeeded };
    }
    async getByOrder() {
        return { id: 'pay1', status: PaymentStatus.Succeeded };
    }
}

// Программа: Bronze(0,0%), Silver(2000,10%) — один заказ пересекает порог.
const PROGRAM = {
    basis: 'total_spend',
    active: true,
    tiers: [
        { level: 1, name: 'Bronze', threshold: 0, discountType: 'percent', discountValue: 0 },
        { level: 2, name: 'Silver', threshold: 2000, discountType: 'percent', discountValue: 10 },
    ],
};

@Injectable()
class FakeProgramsRepo {
    async findActive() {
        return PROGRAM;
    }
}

@Injectable()
class FakeLedgerRepo {
    async create(data: Record<string, unknown>) {
        return data;
    }
}

@Injectable()
class FakeCart {
    async findByBuyer() {
        // Свежая корзина при каждом checkout (очистку игнорируем).
        return {
            id: 'cart1',
            _id: { toString: () => 'cart1' },
            items: [
                { productId: 'p1', vendorId: 'v1', qty: 2, priceSnapshot: 1000 },
                {
                    productId: 'p2',
                    vendorId: 'v2',
                    qty: 1,
                    priceSnapshot: 500,
                    discountSnapshot: { type: 'percent', value: 20 },
                },
            ],
        };
    }
    async updateById() {}
}

@Injectable()
class FakeOrdersRepo {
    private seq = 0;
    readonly byId = new Map<string, Record<string, unknown>>();
    async create(data: Record<string, unknown>) {
        this.seq += 1;
        const id = `order${this.seq}`;
        const doc = { ...data, id, _id: { toString: () => id } };
        this.byId.set(id, doc);
        return doc;
    }
    async findById(id: string) {
        return this.byId.get(id) ?? null;
    }
    async updateById(id: string, patch: Record<string, unknown>) {
        const doc = this.byId.get(id);
        if (!doc) {
            return null;
        }
        Object.assign(doc, patch);
        return doc;
    }
    async findByBuyer() {
        return { data: [], meta: {} };
    }
}

@Injectable()
class FakeVendorOrdersRepo {
    readonly created: Array<Record<string, unknown>> = [];
    async create(data: Record<string, unknown>) {
        const doc = {
            ...data,
            id: `vo${this.created.length + 1}`,
            _id: { toString: () => 'vo' },
            deliveryStatus: 'accepted',
            deliveryEvents: [],
        };
        this.created.push(doc);
        return doc;
    }
}

@Module({
    providers: [
        OrdersService,
        LoyaltyService,
        { provide: UsersServiceContract, useClass: InMemoryUsers },
        { provide: LoyaltyServiceContract, useExisting: LoyaltyService },
        { provide: LoyaltyProgramsRepository, useClass: FakeProgramsRepo },
        { provide: LoyaltyLedgerRepository, useClass: FakeLedgerRepo },
        { provide: CartsRepository, useClass: FakeCart },
        { provide: OrdersRepository, useClass: FakeOrdersRepo },
        { provide: VendorOrdersRepository, useClass: FakeVendorOrdersRepo },
        { provide: DeliveryAddressesRepository, useValue: {} },
        { provide: CatalogServiceContract, useClass: FakeCatalog },
        { provide: PaymentsServiceContract, useClass: FakePayments },
    ],
})
class LoyaltyFlowModule {}

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
    phone: '+37410000060',
};

describe('Loyalty e2e (заказ→рост метрики→новый уровень→скидка; payout вендора неизменен)', () => {
    let moduleRef: Awaited<ReturnType<ReturnType<typeof Test.createTestingModule>['compile']>>;
    let orders: OrdersService;
    let payments: FakePayments;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                ConfigKitModule.forRoot({
                    env: testEnv,
                    configDir: resolve(import.meta.dirname, '../../../../config'),
                }),
                LoyaltyFlowModule,
            ],
        }).compile();
        orders = moduleRef.get(OrdersService);
        payments = moduleRef.get(PaymentsServiceContract) as unknown as FakePayments;
    });

    afterAll(async () => {
        await moduleRef?.close();
    });

    it('первый заказ — без скидки (Bronze); после завершения уровень растёт; второй — со скидкой; payout прежний', async () => {
        // 1) Первый заказ: метрика 0 → Bronze 0% → скидки нет.
        const r1 = await orders.checkout(BUYER, { deliveryAddress: address });
        expect(r1.order.total).toBe(2400);
        expect(r1.order.loyaltyDiscount).toBe(0);
        const v1Payout1 = r1.splits.find((s) => s.vendorId === 'v1')?.payoutAmount;
        const v2Payout1 = r1.splits.find((s) => s.vendorId === 'v2')?.payoutAmount;
        expect(v1Payout1).toBe(1850);
        expect(v2Payout1).toBe(370);

        // 2) Завершаем заказ: Created→Paid→Processing→Completed → метрика растёт.
        await orders.advanceStatus(r1.order.id, OrderStatus.Paid);
        await orders.advanceStatus(r1.order.id, OrderStatus.Processing);
        await orders.advanceStatus(r1.order.id, OrderStatus.Completed);

        // 3) Второй заказ: метрика 2400 ≥ 2000 → Silver 10% → скидка 240.
        const r2 = await orders.checkout(BUYER, { deliveryAddress: address });
        expect(r2.order.loyaltyDiscount).toBe(240); // 10% от 2400
        expect(r2.order.total).toBe(2160); // 2400 − 240, платит покупатель
        expect(payments.last?.amount).toBe(2160); // платёж = сумма после лояльности

        // payout вендоров НЕ изменился — скидку несёт платформа.
        expect(r2.splits.find((s) => s.vendorId === 'v1')?.payoutAmount).toBe(v1Payout1);
        expect(r2.splits.find((s) => s.vendorId === 'v2')?.payoutAmount).toBe(v2Payout1);
        // commission тоже прежняя (считается до лояльности).
        expect(r2.splits.find((s) => s.vendorId === 'v1')?.commissionAmount).toBe(
            r1.splits.find((s) => s.vendorId === 'v1')?.commissionAmount,
        );
    });
});
