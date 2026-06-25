import { resolve } from 'node:path';
import {
    AI_JOBS_QUEUE,
    AiAssistantController,
    AiAssistantService,
    AiJobsRepository,
} from '@brickam/ai-assistant';
import { AuthModule } from '@brickam/auth';
import { ConfigKitModule } from '@brickam/config-kit';
import {
    type AiPrompts,
    type CreateUserContract,
    ImageProvider,
    LlmProvider,
    type MediaInput,
    NotificationsServiceContract,
    PlatformSettingsContract,
    type ProductAiContext,
    ProductMediaContract,
    type TemplateVars,
    type UserContract,
    UserStatus,
    UsersServiceContract,
    VideoProvider,
} from '@brickam/domain-kit';
import { I18nKitModule } from '@brickam/i18n-kit';
import { ServerKitModule } from '@brickam/server-kit';
import { getQueueToken } from '@nestjs/bullmq';
import { Global, type INestApplication, Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

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
        { provide: UsersServiceContract, useClass: InMemoryUsers },
        { provide: NotificationsServiceContract, useClass: InMemoryNotifications },
    ],
    exports: [UsersServiceContract, NotificationsServiceContract],
})
class FakeAuthDeps {}

@Injectable()
class FakeLlm extends LlmProvider {
    readonly name = 'fake';
    async complete() {
        return JSON.stringify({ hy: 'Ն', ru: 'Описание', en: 'Description' });
    }
}
@Injectable()
class FakeImage extends ImageProvider {
    readonly name = 'fake';
    async generate() {
        return { url: 'https://mock.local/img/x.png' };
    }
}
@Injectable()
class FakeVideo extends VideoProvider {
    readonly name = 'fake';
    async slideshow() {
        return { url: 'https://mock.local/vid/x.mp4', thumbnailUrl: 'g1' };
    }
}
@Injectable()
class FakePlatformSettings extends PlatformSettingsContract {
    async getAiPrompts(): Promise<AiPrompts> {
        return { description: 'tpl-d', image: 'tpl-i', video: 'tpl-v' };
    }
}

const setCover = vi.fn(async (_p: string, _v: string, _c: MediaInput) => {});

@Injectable()
class FakeProductMedia extends ProductMediaContract {
    async getProductContext(): Promise<ProductAiContext> {
        return {
            title: { hy: 'A', ru: 'A', en: 'A' },
            description: { hy: 'B', ru: 'B', en: 'B' },
            categoryId: 'c1',
            gallery: ['g1', 'g2'],
        };
    }
    setCover = setCover;
}

@Injectable()
class FakeAiJobsRepo {
    private seq = 0;
    readonly byId = new Map<string, Record<string, unknown>>();
    async create(data: Record<string, unknown>) {
        this.seq += 1;
        const id = String(this.seq);
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
    async findByVendor(vendorId: string) {
        return [...this.byId.values()].filter((d) => d['vendorId'] === vendorId);
    }
}

@Module({
    controllers: [AiAssistantController],
    providers: [
        AiAssistantService,
        { provide: AiJobsRepository, useClass: FakeAiJobsRepo },
        { provide: PlatformSettingsContract, useClass: FakePlatformSettings },
        { provide: ProductMediaContract, useClass: FakeProductMedia },
        { provide: LlmProvider, useClass: FakeLlm },
        { provide: ImageProvider, useClass: FakeImage },
        { provide: VideoProvider, useClass: FakeVideo },
        { provide: getQueueToken(AI_JOBS_QUEUE), useValue: { add: vi.fn() } },
    ],
})
class AiAssistantTestModule {}

const testEnv = {
    MONGO_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'e2e-access',
    JWT_REFRESH_SECRET: 'e2e-refresh',
};

describe('AI-assistant e2e (ai_jobs lifecycle на мок-провайдерах)', () => {
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
                AiAssistantTestModule,
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
        http = request(app.getHttpServer());

        const notifications = app.get(
            NotificationsServiceContract,
        ) as unknown as InMemoryNotifications;
        const phone = '+37410000080';
        await http
            .post('/api/auth/register')
            .send({ phone, password: 'Password123', name: 'Vendor', role: 'vendor_owner' });
        const verify = await http
            .post('/api/auth/verify-otp')
            .send({ phone, code: notifications.codes.get(phone) });
        token = verify.body.data.tokens.accessToken;
    });

    afterAll(async () => {
        await app?.close();
    });

    it('создание→обработка(done)→прикрепление обложки', async () => {
        // create — задача попадает в очередь со статусом queued
        const created = await http
            .post('/api/ai-assistant/jobs')
            .set(auth())
            .send({ type: 'image', userPrompt: 'красивое фото товара', productId: 'p1' });
        expect(created.status).toBe(201);
        expect(created.body.data.status).toBe('queued');
        const jobId = created.body.data.id;

        // обрабатываем напрямую (в проде — BullMQ-процессор)
        await (app.get(AiAssistantService) as AiAssistantService).process(jobId);

        const done = await http.get(`/api/ai-assistant/jobs/${jobId}`).set(auth());
        expect(done.body.data.status).toBe('done');
        expect(done.body.data.progress).toBe(100);
        expect(done.body.data.result.url).toContain('mock.local/img');

        // прикрепляем результат как обложку товара
        const attach = await http.post(`/api/ai-assistant/jobs/${jobId}/attach`).set(auth()).send();
        expect(attach.status).toBe(201);
        expect(setCover).toHaveBeenCalled();
        const coverArg = setCover.mock.calls[0]?.[2] as MediaInput;
        expect(coverArg.mediaType).toBe('image');
        expect(coverArg.url).toContain('mock.local/img');
    });

    it('без права/контекста продавца недоступно (401 без токена)', async () => {
        const res = await http
            .post('/api/ai-assistant/jobs')
            .send({ type: 'description', userPrompt: 'x' });
        expect(res.status).toBe(401);
    });
});
