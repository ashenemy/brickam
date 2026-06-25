import type { LoyaltyBasis, LoyaltyMetric } from '@brickam/domain-kit';
import { ApiProperty } from '@nestjs/swagger';
import type {
    LoyaltyDiscountType,
    LoyaltyProgramView,
    LoyaltyStatusView,
    Tier,
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
