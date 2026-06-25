import type { AppConfigService } from '@brickam/config-kit';
import { HealthIndicatorService } from '@nestjs/terminus';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RedisHealthIndicator } from './redis.health';

// Мокаем ioredis: реальное соединение не открывается.
// vi.hoisted — чтобы моки были доступны внутри хойстнутой фабрики vi.mock.
const { ping, quit, disconnect } = vi.hoisted(() => ({
    ping: vi.fn(),
    quit: vi.fn(async () => 'OK'),
    disconnect: vi.fn(),
}));

vi.mock('ioredis', () => ({
    // function-выражение (не стрелка) — чтобы работало с `new Redis(...)`.
    Redis: vi.fn(function MockRedis() {
        return { ping, quit, disconnect };
    }),
}));

describe('RedisHealthIndicator', () => {
    let indicator: RedisHealthIndicator;

    // Узкий double конфига — индикатор использует только queue.redisUrl.
    const config = {
        queue: { redisUrl: 'redis://localhost:6379' },
    } as Pick<AppConfigService, 'queue'> as AppConfigService;

    // Реальный HealthIndicatorService — он чистый и формирует корректные
    // up/down-результаты без внешних зависимостей.
    const healthIndicatorService = new HealthIndicatorService();

    beforeEach(() => {
        ping.mockReset();
        quit.mockClear();
        disconnect.mockClear();
        indicator = new RedisHealthIndicator(config, healthIndicatorService);
    });

    it('ping успешен → up + клиент закрыт', async () => {
        ping.mockResolvedValueOnce('PONG');

        const result = await indicator.isHealthy('redis');

        expect(result.redis.status).toBe('up');
        expect(result.redis.response).toBe('PONG');
        expect(quit).toHaveBeenCalled();
    });

    it('ping бросает → down (статус, не исключение) + клиент закрыт', async () => {
        ping.mockRejectedValueOnce(new Error('ECONNREFUSED'));

        const result = await indicator.isHealthy('redis');

        expect(result.redis.status).toBe('down');
        expect(result.redis.message).toBe('ECONNREFUSED');
        expect(quit).toHaveBeenCalled();
    });

    it('не-Error reject → down с приведением через String()', async () => {
        ping.mockRejectedValueOnce('raw string error');

        const result = await indicator.isHealthy('redis');

        expect(result.redis.status).toBe('down');
        expect(result.redis.message).toBe('raw string error');
        expect(quit).toHaveBeenCalled();
    });

    it('падение quit() не маскирует down-результат (fallback на disconnect)', async () => {
        ping.mockRejectedValueOnce(new Error('boom'));
        quit.mockRejectedValueOnce(new Error('quit failed'));

        const result = await indicator.isHealthy('redis');

        expect(result.redis.status).toBe('down');
        expect(disconnect).toHaveBeenCalled();
    });
});
