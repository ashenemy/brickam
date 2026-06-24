import { Public } from '@brickam/auth';
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(private readonly health: HealthService) {}

    @Public()
    @Get()
    @ApiOkResponse({ description: 'Статус сервиса' })
    check() {
        return this.health.check();
    }
}
