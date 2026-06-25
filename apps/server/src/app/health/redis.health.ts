import { AppConfigService } from '@brickam/config-kit';
import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { Redis } from 'ioredis';

/**
 * Кастомный health-индикатор для Redis.
 *
 * Соединение НЕ открывается при импорте/инициализации модуля: клиент создаётся
 * лениво (`lazyConnect: true`) и только в момент вызова проверки. После пинга
 * клиент гарантированно закрывается (`quit()` в finally), поэтому индикатор не
 * держит висящих коннектов между readiness-пробами.
 *
 * Любая ошибка/таймаут пинга оборачивается в статус `down` и НЕ пробрасывается
 * наружу — readiness-эндпоинт должен отдать 503 с деталями, а не упасть.
 */
@Injectable()
export class RedisHealthIndicator {
    constructor(
        private readonly config: AppConfigService,
        private readonly healthIndicatorService: HealthIndicatorService,
    ) {}

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        const indicator = this.healthIndicatorService.check(key);

        const client = new Redis(this.config.queue.redisUrl, {
            lazyConnect: true,
            maxRetriesPerRequest: null,
            enableOfflineQueue: false,
        });

        try {
            const pong = await client.ping();
            return indicator.up({ response: pong });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return indicator.down({ message });
        } finally {
            // Закрываем клиент в любом случае, чтобы не оставлять открытое
            // соединение/таймеры между проверками.
            try {
                await client.quit();
            } catch {
                client.disconnect();
            }
        }
    }
}
