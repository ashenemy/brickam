import { Public } from '@brickam/auth';
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthService } from './health.service';
import { RedisHealthIndicator } from './redis.health';

// Пробы опрашиваются k8s/балансировщиком часто — выводим из-под rate-limit.
@SkipThrottle()
@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthService,
        private readonly healthCheck: HealthCheckService,
        private readonly mongoose: MongooseHealthIndicator,
        private readonly redis: RedisHealthIndicator,
    ) {}

    /**
     * Общий статус сервиса (обратная совместимость) — не пингует зависимости.
     */
    @Public()
    @Get()
    @ApiOkResponse({ description: 'Статус сервиса' })
    check() {
        return this.health.check();
    }

    /**
     * Liveness-проба для k8s: только факт того, что процесс жив.
     * Без внешних зависимостей (БД/Redis), чтобы под не убивали при
     * временной недоступности инфраструктуры.
     */
    @Public()
    @Get('live')
    @HealthCheck()
    @ApiOkResponse({ description: 'Процесс жив' })
    live() {
        return this.healthCheck.check([]);
    }

    /**
     * Readiness-проба для k8s: готовность принимать трафик.
     * Пингует Mongo и Redis. При недоступности любой зависимости terminus
     * вернёт 503 с детализацией по каждому индикатору.
     */
    @Public()
    @Get('ready')
    @HealthCheck()
    @ApiOkResponse({ description: 'Сервис готов принимать трафик' })
    @ApiServiceUnavailableResponse({ description: 'Зависимость недоступна' })
    ready() {
        return this.healthCheck.check([
            () => this.mongoose.pingCheck('mongo'),
            () => this.redis.isHealthy('redis'),
        ]);
    }
}
