import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { DisputeContract, DisputeStatus } from '../../@types';

/** Тело запроса на открытие спора (openedByUserId — из аутентификации). */
export class OpenDisputeDto {
    @ApiProperty({ description: 'Идентификатор заказа' })
    @IsString()
    @IsNotEmpty()
    orderId!: string;

    @ApiProperty({ description: 'Идентификатор саб-заказа вендора (опционально)', required: false })
    @IsOptional()
    @IsString()
    vendorOrderId?: string;

    @ApiProperty({ description: 'Идентификатор вендора' })
    @IsString()
    @IsNotEmpty()
    vendorId!: string;

    @ApiProperty({ description: 'Причина спора', maxLength: 2000 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    reason!: string;
}

/** Тело запроса на разрешение спора. */
export class ResolveDisputeDto {
    @ApiProperty({ description: 'Текст решения по спору', maxLength: 2000 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(2000)
    resolution!: string;
}

/** Swagger-модель спора (публичный контракт). */
export class DisputeDto implements DisputeContract {
    @ApiProperty() id!: string;
    @ApiProperty() orderId!: string;
    @ApiProperty({ required: false }) vendorOrderId?: string;
    @ApiProperty() openedByUserId!: string;
    @ApiProperty() vendorId!: string;
    @ApiProperty() reason!: string;
    @ApiProperty({ enum: ['open', 'reviewing', 'resolved'] }) status!: DisputeStatus;
    @ApiProperty({ required: false }) resolution?: string;
    @ApiProperty() at!: Date;
    @ApiProperty() createdAt!: Date;
    @ApiProperty() updatedAt!: Date;
}
