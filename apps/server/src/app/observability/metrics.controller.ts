import { Public } from '@brickam/auth';
import { Controller, Get, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import type { Response } from 'express';

/**
 * Эндпоинт метрик Prometheus `GET /api/metrics`. Публичный (скрейпится изнутри
 * кластера) и без rate-limit (частые опросы). Наружу закрывается на уровне сети.
 */
@Controller('metrics')
export class MetricsController extends PrometheusController {
    @Get()
    @Public()
    @SkipThrottle()
    override async index(@Res({ passthrough: false }) response: Response): Promise<string> {
        return super.index(response);
    }
}
