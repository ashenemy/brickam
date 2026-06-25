import { HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { RedisHealthIndicator } from './redis.health';

describe('HealthController', () => {
    let controller: HealthController;
    let healthCheck: { check: ReturnType<typeof vi.fn> };
    let mongoose: { pingCheck: ReturnType<typeof vi.fn> };
    let redis: { isHealthy: ReturnType<typeof vi.fn> };

    const healthService = {
        check: vi.fn(() => ({ status: 'ok', env: 'test', uptimeSec: 1 })),
    };

    beforeEach(async () => {
        healthCheck = { check: vi.fn(async () => ({ status: 'ok' })) };
        mongoose = {
            pingCheck: vi.fn(async () => ({ mongo: { status: 'up' } })),
        };
        redis = {
            isHealthy: vi.fn(async () => ({ redis: { status: 'up' } })),
        };

        const moduleRef: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
            providers: [
                { provide: HealthService, useValue: healthService },
                { provide: HealthCheckService, useValue: healthCheck },
                { provide: MongooseHealthIndicator, useValue: mongoose },
                { provide: RedisHealthIndicator, useValue: redis },
            ],
        }).compile();

        controller = moduleRef.get(HealthController);
    });

    it('check() возвращает общий статус сервиса', () => {
        expect(controller.check()).toEqual({
            status: 'ok',
            env: 'test',
            uptimeSec: 1,
        });
        expect(healthService.check).toHaveBeenCalled();
    });

    it('live() выполняет health-check без зависимостей', async () => {
        const result = await controller.live();
        expect(result).toEqual({ status: 'ok' });
        // Liveness не пингует БД/Redis — пустой список индикаторов.
        expect(healthCheck.check).toHaveBeenCalledWith([]);
    });

    it('ready() пингует mongo и redis через HealthCheckService', async () => {
        await controller.ready();

        expect(healthCheck.check).toHaveBeenCalledTimes(1);
        const indicators = healthCheck.check.mock.calls[0][0] as Array<() => unknown>;
        expect(indicators).toHaveLength(2);

        // Дёргаем переданные фабрики, чтобы убедиться, что они вызывают
        // соответствующие индикаторы с нужными ключами.
        await Promise.all(indicators.map((fn) => fn()));
        expect(mongoose.pingCheck).toHaveBeenCalledWith('mongo');
        expect(redis.isHealthy).toHaveBeenCalledWith('redis');
    });
});
