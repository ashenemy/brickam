import { Auth, CurrentUser } from '@brickam/server-kit';
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { LoyaltyProgramView, LoyaltyStatusView } from '../@types';
import { LoyaltyProgramDto, LoyaltyStatusDto } from './dto/loyalty.dto';
import { LoyaltyService } from './loyalty.service';
import { Public } from './public.decorator';

/** Маршруты лояльности (Foundations §11, Stage 12). */
@ApiTags('loyalty')
@Controller('loyalty')
export class LoyaltyController {
    constructor(private readonly loyaltyService: LoyaltyService) {}

    /** Статус лояльности текущего покупателя (метрика, уровни, остаток). */
    @Get('me')
    @Auth()
    @ApiOkResponse({ type: LoyaltyStatusDto, description: 'Статус лояльности покупателя' })
    getMe(@CurrentUser('id') buyerId: string): Promise<LoyaltyStatusView> {
        return this.loyaltyService.getStatus(buyerId);
    }

    /** Активная программа лояльности (basis + уровни). Публично. */
    @Get('program')
    @Public()
    @ApiOkResponse({ type: LoyaltyProgramDto, description: 'Активная программа лояльности' })
    getProgram(): Promise<LoyaltyProgramView> {
        return this.loyaltyService.getActiveProgram();
    }
}
