import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import type { SubscriptionContract, SubscriptionPlan } from '../../@types';

/** Тело смены тарифа подписки. */
export class SetPlanDto {
    @ApiProperty({ description: 'Тариф', enum: ['free', 'pro'] })
    @IsEnum(['free', 'pro'])
    plan!: SubscriptionPlan;
}

/** Swagger-модель подписки (публичный контракт). */
export class SubscriptionDto implements SubscriptionContract {
    @ApiProperty() id!: string;
    @ApiProperty() vendorId!: string;
    @ApiProperty({ enum: ['free', 'pro'] }) plan!: SubscriptionPlan;
    @ApiProperty() since!: Date;
    @ApiProperty() createdAt!: Date;
    @ApiProperty() updatedAt!: Date;
}
