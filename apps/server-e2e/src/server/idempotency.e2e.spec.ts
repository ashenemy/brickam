import { resolve } from 'node:path';
import { ConfigKitModule } from '@brickam/config-kit';
import { I18nKitModule } from '@brickam/i18n-kit';
import {
    IdempotencyInterceptor,
    IdempotencyRepository,
    IdempotencyService,
} from '@brickam/idempotency';
import { Idempotent, ServerKitModule } from '@brickam/server-kit';
import { Body, Controller, type INestApplication, Injectable, Module, Post } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Счётчик фактических выполнений хендлера (растёт только при реальном вызове).
let execCount = 0;

@Controller('idem-test')
class TestController {
    @Post()
    @Idempotent()
    handle(@Body() body: { value: string }): { count: number; echo: string } {
        execCount += 1;
        return { count: execCount, echo: body.value };
    }
}

/** In-memory хранилище ключей идемпотентности (без Mongo). */
@Injectable()
class FakeIdempotencyRepo {
    private readonly store = new Map<string, Record<string, unknown>>();
    async findByKey(key: string) {
        return this.store.get(key) ?? null;
    }
    async insertPending(doc: Record<string, unknown>) {
        const key = doc['key'] as string;
        if (this.store.has(key)) {
            return null; // гонка/дубль
        }
        this.store.set(key, { ...doc, status: 'pending' });
        return doc;
    }
    async markCompleted(key: string, statusCode: number, response: unknown) {
        const doc = this.store.get(key);
        if (doc) {
            doc['status'] = 'completed';
            doc['statusCode'] = statusCode;
            doc['response'] = response;
        }
    }
    async deleteByKey(key: string) {
        this.store.delete(key);
    }
}

@Module({
    controllers: [TestController],
    providers: [
        IdempotencyService,
        IdempotencyInterceptor,
        { provide: IdempotencyRepository, useClass: FakeIdempotencyRepo },
        { provide: APP_INTERCEPTOR, useExisting: IdempotencyInterceptor },
    ],
})
class IdemTestModule {}

const testEnv = {
    MONGO_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'e2e-access',
    JWT_REFRESH_SECRET: 'e2e-refresh',
};

describe('Idempotency e2e (Idempotency-Key: один вызов, повтор-ответ, 409)', () => {
    let app: INestApplication;
    let http: ReturnType<typeof request>;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                ConfigKitModule.forRoot({
                    env: testEnv,
                    configDir: resolve(import.meta.dirname, '../../../../config'),
                }),
                I18nKitModule,
                ServerKitModule.forRoot(),
                IdemTestModule,
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
        http = request(app.getHttpServer());
        execCount = 0;
    });

    afterAll(async () => {
        await app?.close();
    });

    it('повтор с тем же ключом и телом → хендлер НЕ выполняется второй раз', async () => {
        const r1 = await http
            .post('/api/idem-test')
            .set('Idempotency-Key', 'key-1')
            .send({ value: 'a' });
        expect(r1.status).toBe(201);
        expect(execCount).toBe(1);

        const r2 = await http
            .post('/api/idem-test')
            .set('Idempotency-Key', 'key-1')
            .send({ value: 'a' });
        expect([200, 201]).toContain(r2.status);
        expect(execCount).toBe(1); // повтор: хендлер НЕ вызван заново (replay)
    });

    it('тот же ключ, ДРУГОЕ тело → 409 keyConflict', async () => {
        const res = await http
            .post('/api/idem-test')
            .set('Idempotency-Key', 'key-1')
            .send({ value: 'b' });
        expect(res.status).toBe(409);
        expect(execCount).toBe(1);
    });

    it('без Idempotency-Key → каждый запрос выполняется', async () => {
        await http.post('/api/idem-test').send({ value: 'x' });
        await http.post('/api/idem-test').send({ value: 'y' });
        expect(execCount).toBe(3); // 1 (из первого теста) + 2 новых
    });
});
