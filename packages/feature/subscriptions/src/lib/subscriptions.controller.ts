import { ForbiddenException } from '@brickam/core-kit';
import { Auth, CurrentVendor, type VendorContext } from '@brickam/server-kit';
import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { SubscriptionContract } from '../@types';
import { SetPlanDto, SubscriptionDto } from './dto/subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

/** Маршруты подписки вендора (Foundations §15, Stage 15). Только владелец. */
@ApiTags('subscriptions')
@Controller('subscription')
export class SubscriptionsController {
    constructor(private readonly subscriptionsService: SubscriptionsService) {}

    /** Текущая подписка своего вендора (free по умолчанию). */
    @Get()
    @Auth()
    @ApiOkResponse({ type: SubscriptionDto, description: 'Подписка вендора' })
    getMine(@CurrentVendor() vendor: VendorContext | undefined): Promise<SubscriptionContract> {
        if (!vendor) {
            throw new ForbiddenException('errors.vendors.notOwner');
        }
        return this.subscriptionsService.getOrCreate(vendor.id);
    }

    /** Меняет тариф подписки своего вендора. */
    @Put()
    @Auth()
    @ApiOkResponse({ type: SubscriptionDto, description: 'Обновлённая подписка' })
    setPlan(
        @CurrentVendor() vendor: VendorContext | undefined,
        @Body() dto: SetPlanDto,
    ): Promise<SubscriptionContract> {
        if (!vendor) {
            throw new ForbiddenException('errors.vendors.notOwner');
        }
        return this.subscriptionsService.setPlan(vendor.id, dto.plan);
    }
}
