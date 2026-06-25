import { resolve } from 'node:path';
import { AuthModule } from '@brickam/auth';
import { ConfigKitModule } from '@brickam/config-kit';
import {
    ChatServiceContract,
    type CreateUserContract,
    type InvoiceOrderInput,
    NotificationsServiceContract,
    OrdersServiceContract,
    type TemplateVars,
    type UserContract,
    UserStatus,
    UsersServiceContract,
} from '@brickam/domain-kit';
import { I18nKitModule } from '@brickam/i18n-kit';
import {
    InvoicePdfService,
    InvoicesController,
    InvoicesRepository,
    InvoicesService,
} from '@brickam/invoices';
import { ServerKitModule } from '@brickam/server-kit';
import { Global, type INestApplication, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

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
            // Вендор-владелец получает vendorId, чтобы токен нёс его для @CurrentVendor.
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

const postInvoiceMessage = vi.fn(async () => {});
const createFromInvoice = vi.fn(async (input: InvoiceOrderInput) => ({
    orderId: 'ord1',
    orderNumber: 'BH-INV-1',
    paymentId: 'pay1',
    total: input.lineItems.reduce((s, li) => s + li.price * li.qty, 0),
}));

@Injectable()
class FakeChat extends ChatServiceContract {
    postInvoiceMessage = postInvoiceMessage;
}

@Injectable()
class FakeOrders extends OrdersServiceContract {
    async getVendorOrderForReview() {
        return null;
    }
    createFromInvoice = createFromInvoice;
}

@Injectable()
class FakeInvoicesRepo {
    private seq = 0;
    private readonly byId = new Map<string, Record<string, unknown>>();
    async create(data: Record<string, unknown>) {
        this.seq += 1;
        const id = String(this.seq);
        const doc = {
            ...data,
            id,
            _id: { toString: () => id },
            createdAt: new Date(),
            updatedAt: new Date(),
        };
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
    async findByNumber() {
        return null;
    }
    async findByChat() {
        return [];
    }
}

@Module({
    controllers: [InvoicesController],
    providers: [
        InvoicesService,
        InvoicePdfService,
        { provide: InvoicesRepository, useClass: FakeInvoicesRepo },
        { provide: ChatServiceContract, useClass: FakeChat },
        { provide: OrdersServiceContract, useClass: FakeOrders },
    ],
})
class InvoicesTestModule {}

const testEnv = {
    MONGO_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'e2e-access',
    JWT_REFRESH_SECRET: 'e2e-refresh',
};

describe('Invoices e2e (создание→отправка→оплата→заказ, право invoices.create)', () => {
    let app: INestApplication;
    let http: ReturnType<typeof request>;
    let vendorToken: string;
    let buyerToken: string;
    const bearer = (t: string) => ({ Authorization: `Bearer ${t}` });

    const registerAndVerify = async (phone: string, role: string): Promise<string> => {
        const notifications = app.get(
            NotificationsServiceContract,
        ) as unknown as InMemoryNotifications;
        await http
            .post('/api/auth/register')
            .send({ phone, password: 'Password123', name: role, role });
        const verify = await http
            .post('/api/auth/verify-otp')
            .send({ phone, code: notifications.codes.get(phone) });
        return verify.body.data.tokens.accessToken;
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
                InvoicesTestModule,
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
        http = request(app.getHttpServer());

        vendorToken = await registerAndVerify('+37410000040', 'vendor_owner');
        buyerToken = await registerAndVerify('+37410000041', 'buyer');
    });

    afterAll(async () => {
        await app?.close();
    });

    const draftBody = {
        chatId: 'c1',
        buyerId: 'buyer-x',
        lineItems: [
            { title: 'Цемент', qty: 2, price: 1000 },
            { title: 'Доставка', qty: 1, price: 500 },
        ],
        discount: { type: 'percent', value: 10 },
        validUntil: '2030-01-01T00:00:00.000Z',
    };

    it('покупатель без права invoices.create → 403', async () => {
        const res = await http.post('/api/invoices').set(bearer(buyerToken)).send(draftBody);
        expect(res.status).toBe(403);
    });

    it('создание→отправка→оплата→заказ', async () => {
        // create (вендор)
        const created = await http.post('/api/invoices').set(bearer(vendorToken)).send(draftBody);
        expect(created.status).toBe(201);
        expect(created.body.data.status).toBe('draft');
        expect(created.body.data.subtotal).toBe(2500);
        expect(created.body.data.total).toBe(2250); // 2500 − 10%
        expect(created.body.data.invoiceNumber).toBeTruthy();
        const id = created.body.data.id;

        // send → sent + постинг в чат
        const sent = await http.post(`/api/invoices/${id}/send`).set(bearer(vendorToken)).send();
        expect(sent.status).toBe(201);
        expect(sent.body.data.status).toBe('sent');
        expect(postInvoiceMessage).toHaveBeenCalledWith('c1', 'v1', id);

        // pay (покупатель — buyerId инвойса) → заказ
        // buyerId инвойса = 'buyer-x'; платит тот же id. Подменим инвойс на текущего покупателя:
        // оплата проверяет invoice.buyerId === buyerId, поэтому создаём инвойс на реального покупателя.
        const buyerId = (
            await (app.get(UsersServiceContract) as unknown as InMemoryUsersService).findByPhone(
                '+37410000041',
            )
        )?.id;
        const inv2 = await http
            .post('/api/invoices')
            .set(bearer(vendorToken))
            .send({ ...draftBody, buyerId });
        const id2 = inv2.body.data.id;
        await http.post(`/api/invoices/${id2}/send`).set(bearer(vendorToken)).send();

        const paid = await http.post(`/api/invoices/${id2}/pay`).set(bearer(buyerToken)).send();
        expect(paid.status).toBe(201);
        expect(paid.body.data.invoice.status).toBe('paid');
        expect(paid.body.data.orderId).toBe('ord1');
        expect(createFromInvoice).toHaveBeenCalled();
    });

    it('PDF инвойса отдаётся как application/pdf', async () => {
        const created = await http.post('/api/invoices').set(bearer(vendorToken)).send(draftBody);
        const res = await http
            .get(`/api/invoices/${created.body.data.id}/pdf`)
            .set(bearer(vendorToken));
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('application/pdf');
        expect(res.body.length).toBeGreaterThan(0);
    });
});
