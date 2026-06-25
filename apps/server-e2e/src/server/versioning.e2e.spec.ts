import {
    Controller,
    Get,
    type INestApplication,
    Module,
    VERSION_NEUTRAL,
    VersioningType,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

@Controller('ping')
class PingController {
    @Get()
    ping() {
        return { ok: true };
    }
}

@Module({ controllers: [PingController] })
class PingModule {}

describe('API versioning e2e (URI: /api/v1 + обратная совместимость /api)', () => {
    let app: INestApplication;
    let http: ReturnType<typeof request>;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({ imports: [PingModule] }).compile();
        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api');
        app.enableVersioning({ type: VersioningType.URI, defaultVersion: ['1', VERSION_NEUTRAL] });
        await app.init();
        http = request(app.getHttpServer());
    });

    afterAll(async () => {
        await app?.close();
    });

    it('маршрут доступен по версионированному пути /api/v1/ping', async () => {
        const res = await http.get('/api/v1/ping');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true });
    });

    it('тот же маршрут доступен по неверсионированному /api/ping (NEUTRAL)', async () => {
        const res = await http.get('/api/ping');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true });
    });

    it('несуществующая версия /api/v2/ping → 404', async () => {
        const res = await http.get('/api/v2/ping');
        expect(res.status).toBe(404);
    });
});
