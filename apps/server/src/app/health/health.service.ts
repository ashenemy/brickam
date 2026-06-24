import { AppConfigService } from '@brickam/config-kit';
import { Injectable } from '@nestjs/common';

export type HealthStatus = {
    status: 'ok';
    env: string;
    uptimeSec: number;
};

@Injectable()
export class HealthService {
    constructor(private readonly config: AppConfigService) {}

    check(): HealthStatus {
        return {
            status: 'ok',
            env: this.config.all.env.nodeEnv,
            uptimeSec: Math.floor(process.uptime()),
        };
    }
}
