import type { LoyaltyBasis, LoyaltyMetric } from '@brickam/domain-kit';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsIn,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';
import type {
    CreateProgramData,
    LoyaltyDiscountType,
    LoyaltyProgramView,
    LoyaltyStatusView,
    Tier,
    UpdateProgramData,
} from '../../@types';

/** Swagger-модель уровня программы лояльности. */
export class TierDto implements Tier {
    @ApiProperty({ description: 'Номер уровня' }) level!: number;
    @ApiProperty({ description: 'Название уровня' }) name!: string;
    @ApiProperty({ description: 'Минимальная метрика для уровня' }) threshold!: number;
    @ApiProperty({ description: 'Тип скидки', enum: ['percent', 'amount'] })
    discountType!: LoyaltyDiscountType;
    @ApiProperty({ description: 'Значение скидки (% или AMD)' }) discountValue!: number;
}

/** Swagger-модель метрики лояльности покупателя. */
export class LoyaltyMetricDto implements LoyaltyMetric {
    @ApiProperty({ description: 'Суммарные траты (AMD)' }) totalSpend!: number;
    @ApiProperty({ description: 'Количество заказов' }) totalOrders!: number;
    @ApiProperty({ description: 'Текущий уровень', required: false }) currentTierId?: string;
}

/** Swagger-модель активной программы лояльности. */
export class LoyaltyProgramDto implements LoyaltyProgramView {
    @ApiProperty({ description: 'Основа расчёта', enum: ['total_spend', 'order_count'] })
    basis!: LoyaltyBasis;
    @ApiProperty({ type: [TierDto], description: 'Уровни программы' }) tiers!: TierDto[];
}

/** Swagger-модель статуса лояльности покупателя (для UI). */
export class LoyaltyStatusDto implements LoyaltyStatusView {
    @ApiProperty({ type: LoyaltyMetricDto, description: 'Метрика покупателя' })
    metric!: LoyaltyMetric;
    @ApiProperty({ description: 'Основа расчёта', enum: ['total_spend', 'order_count'] })
    basis!: LoyaltyBasis;
    @ApiProperty({ type: TierDto, required: false, description: 'Текущий уровень' })
    currentTier?: Tier;
    @ApiProperty({ type: TierDto, required: false, description: 'Следующий уровень' })
    nextTier?: Tier;
    @ApiProperty({ required: false, description: 'Сколько осталось до следующего уровня' })
    toNext?: number;
}

/** Входной уровень программы (админ-конструктор). */
export class TierInputDto implements Tier {
    @ApiProperty({ description: 'Номер уровня' })
    @IsNumber()
    level!: number;

    @ApiProperty({ description: 'Название уровня' })
    @IsString()
    name!: string;

    @ApiProperty({ description: 'Минимальная метрика для уровня' })
    @IsNumber()
    @Min(0)
    threshold!: number;

    @ApiProperty({ description: 'Тип скидки', enum: ['percent', 'amount'] })
    @IsIn(['percent', 'amount'])
    discountType!: LoyaltyDiscountType;

    @ApiProperty({ description: 'Значение скидки (% или AMD)' })
    @IsNumber()
    @Min(0)
    discountValue!: number;
}

/** Создание программы лояльности (админ). Создаётся НЕ активной. */
export class CreateProgramDto implements CreateProgramData {
    @ApiProperty({ description: 'Основа расчёта', enum: ['total_spend', 'order_count'] })
    @IsIn(['total_spend', 'order_count'])
    basis!: LoyaltyBasis;

    @ApiProperty({ type: [TierInputDto], description: 'Уровни программы' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TierInputDto)
    tiers!: Tier[];
}

/** Частичное обновление программы лояльности (админ). */
export class UpdateProgramDto implements UpdateProgramData {
    @ApiPropertyOptional({ enum: ['total_spend', 'order_count'] })
    @IsOptional()
    @IsIn(['total_spend', 'order_count'])
    basis?: LoyaltyBasis;

    @ApiPropertyOptional({ type: [TierInputDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TierInputDto)
    tiers?: Tier[];
}
