import { resolve } from 'node:path';
import { ConfigKitModule } from '@brickam/config-kit';
import { NotFoundException } from '@brickam/core-kit';
import { I18nKitModule } from '@brickam/i18n-kit';
import { ServerKitModule } from '@brickam/server-kit';
import { Controller, Get, type INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Лёгкий health-контроллер (зеркалит apps/server) — e2e не импортирует исходники app
// (граница app→app), а поднимает реальный стек платформенных провайдеров.
@Controller('health')
class HealthController {
    @Get()
    check() {
        return { status: 'ok' };
    }

    @Get('boom')
    boom(): never {
        throw new NotFoundException();
    }
}

@Module({ controllers: [HealthController] })
class HealthModule {}

const testEnv = {
    MONGO_URI: 'mongodb://localhost:27017/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_ACCESS_SECRET: 'e2e-access',
    JWT_REFRESH_SECRET: 'e2e-refresh',
};

describe('Server e2e (in-process, без Mongo)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                ConfigKitModule.forRoot({
                    env: testEnv,
                    configDir: resolve(import.meta.dirname, '../../../../config'),
                }),
                I18nKitModule,
                ServerKitModule.forRoot(),
                HealthModule,
            ],
        }).compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
    });

    afterAll(async () => {
        await app?.close();
    });

    it('GET /api/health → конверт успеха + заголовок traceId', async () => {
        const res = await request(app.getHttpServer()).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, data: { status: 'ok' } });
        expect(res.headers['x-trace-id']).toBeTruthy();
    });

    it('ошибка маршрута → конверт ошибки {success:false,error:{code,message,traceId}}', async () => {
        const res = await request(app.getHttpServer()).get('/api/health/boom');
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('NOT_FOUND');
        expect(res.body.error.message).toBeTruthy();
        expect(res.body.error.traceId).toBeTruthy();
    });

    it('неизвестный маршрут → 404 в унифицированном конверте', async () => {
        const res = await request(app.getHttpServer()).get('/api/nope');
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});
