import { DeliveryStatus } from '@brickam/domain-kit';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

/** Обновление статуса доставки саб-заказа вендора. */
export class UpdateDeliveryDto {
    @ApiProperty({ enum: DeliveryStatus, description: 'Новый статус доставки' })
    @IsEnum(DeliveryStatus)
    status!: DeliveryStatus;

    @ApiPropertyOptional({ description: 'Заметка к событию' })
    @IsOptional()
    @IsString()
    note?: string;
}
