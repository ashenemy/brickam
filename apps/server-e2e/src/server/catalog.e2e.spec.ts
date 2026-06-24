import { resolve } from 'node:path';
import { AuthModule } from '@brickam/auth';
import { ProductsController, ProductsService } from '@brickam/catalog';
import { ConfigKitModule } from '@brickam/config-kit';
import { NotFoundException, type Page } from '@brickam/core-kit';
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
import { Global, type INestApplication, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// --- фейковые зависимости auth (нужны для глобальных guard'ов) ---
@Injectable()
class InMemoryUsersService extends UsersServiceContract {
    async findByPhone(): Promise<UserContract | null> {
        return null;
    }
    async findById(): Promise<UserContract | null> {
        return null;
    }
    async createUser(d: CreateUserContract): Promise<UserContract> {
        return {
            id: '1',
            role: d.role,
            name: d.name,
            phone: d.phone,
            passwordHash: d.passwordHash,
            phoneVerified: false,
            lang: 'hy',
            status: UserStatus.Active,
        };
    }
    async markPhoneVerified(): Promise<void> {}
    async updatePassword(): Promise<void> {}
}

@Injectable()
class InMemoryNotifications extends NotificationsServiceContract {
    async sendSms(_r: string, _k: string, _l: string, _v: TemplateVars): Promise<void> {}
    async sendEmail(): Promise<void> {}
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

// --- фейковый ProductsService (без Mongo) ---
const cannedPage: Page<unknown> = {
    data: [
        {
            id: 'p1',
            slug: 'cement-50',
            vendorId: 'v1',
            categoryId: 'c1',
            title: { hy: 'Ցեմենտ', ru: 'Цемент', en: 'Cement' },
            cover: { mediaType: 'image', url: 'http://img/c.png' },
            price: 1000,
            discount: { type: 'percent', value: 20 },
            finalPrice: 800,
            unit: 'bag',
            stock: 5,
            region: 'Yerevan',
            ratingAvg: 4.5,
            ratingCount: 12,
        },
    ],
    meta: { page: 1, pageSize: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
};

@Injectable()
class FakeProductsService {
    lastQuery: unknown;
    search = vi.fn((query: unknown) => {
        this.lastQuery = query;
        return Promise.resolve(cannedPage);
    });
    getBySlug = vi.fn((slug: string) => {
        if (slug === 'cement-50') {
            return Promise.resolve({
                ...cannedPage.data[0],
                description: { hy: '', ru: '', en: '' },
            });
        }
        return Promise.reject(new NotFoundException());
    });
}

const testEnv = {
    MONGO_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'e2e-access',
    JWT_REFRESH_SECRET: 'e2e-refresh',
};

describe('Catalog e2e (in-process, фейковый ProductsService, без Mongo)', () => {
    let app: INestApplication;
    let http: ReturnType<typeof request>;
    let fakeService: FakeProductsService;

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
            ],
            controllers: [ProductsController],
            providers: [{ provide: ProductsService, useClass: FakeProductsService }],
        }).compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
        http = request(app.getHttpServer());
        fakeService = app.get(ProductsService) as unknown as FakeProductsService;
    });

    afterAll(async () => {
        await app?.close();
    });

    it('публичный листинг отдаёт постраничный конверт', async () => {
        const res = await http.get('/api/catalog/products');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data[0].finalPrice).toBe(800);
        expect(res.body.meta).toMatchObject({ page: 1, total: 1, hasNext: false });
    });

    it('фильтры/сортировка/пагинация доходят до сервиса', async () => {
        const res = await http.get(
            '/api/catalog/products?categoryId=c1&minPrice=100&sort=price_asc&page=2&pageSize=10',
        );
        expect(res.status).toBe(200);
        const q = fakeService.lastQuery as Record<string, unknown>;
        expect(q.categoryId).toBe('c1');
        expect(q.minPrice).toBe(100);
        expect(q.sort).toBe('price_asc');
        expect(q.page).toBe(2);
        expect(q.pageSize).toBe(10);
    });

    it('деталь по slug → конверт; неизвестный slug → 404', async () => {
        const ok = await http.get('/api/catalog/products/cement-50');
        expect(ok.status).toBe(200);
        expect(ok.body.data.slug).toBe('cement-50');

        const notFound = await http.get('/api/catalog/products/missing');
        expect(notFound.status).toBe(404);
        expect(notFound.body.success).toBe(false);
    });

    it('создание товара без токена → 401 (требует products.manage)', async () => {
        const res = await http.post('/api/catalog/products').send({ slug: 'x' });
        expect(res.status).toBe(401);
    });
});
