import type { AiJobStatus, AiJobType } from '@brickam/domain-kit';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import type { AiJobContract, AiJobResult } from '../../@types';

/** Тело запроса на создание AI-задачи (vendorId — из аутентификации). */
export class CreateAiJobDto {
    @ApiProperty({ description: 'Тип генерации', enum: ['description', 'image', 'video'] })
    @IsEnum(['description', 'image', 'video'])
    type!: AiJobType;

    @ApiProperty({ description: 'Промпт продавца', maxLength: 2000 })
    @IsString()
    @MaxLength(2000)
    userPrompt!: string;

    @ApiProperty({ description: 'Идентификатор товара (опционально)', required: false })
    @IsOptional()
    @IsString()
    productId?: string;
}

/** Swagger-модель AI-задачи (статус/прогресс/результат). */
export class AiJobDto implements AiJobContract {
    @ApiProperty() id!: string;
    @ApiProperty() vendorId!: string;
    @ApiProperty({ required: false }) productId?: string;
    @ApiProperty({ enum: ['description', 'image', 'video'] }) type!: AiJobType;
    @ApiProperty({ enum: ['queued', 'processing', 'done', 'failed'] }) status!: AiJobStatus;
    @ApiProperty() userPrompt!: string;
    @ApiProperty({ required: false }) finalPrompt?: string;
    @ApiProperty({ minimum: 0, maximum: 100 }) progress!: number;
    @ApiProperty({ required: false, type: Object }) result?: AiJobResult;
    @ApiProperty({ required: false }) error?: string;
    @ApiProperty() createdAt!: Date;
    @ApiProperty() updatedAt!: Date;
}
