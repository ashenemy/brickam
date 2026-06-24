import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import type { ReviewContract, ReviewStatus } from '../../@types';

/** Тело запроса на создание отзыва (buyerId берётся из аутентификации). */
export class CreateReviewDto {
    @ApiProperty({ description: 'Идентификатор саб-заказа вендора' })
    @IsString()
    @IsNotEmpty()
    vendorOrderId!: string;

    @ApiProperty({ description: 'Оценка 1..5', minimum: 1, maximum: 5 })
    @IsInt()
    @Min(1)
    @Max(5)
    rating!: number;

    @ApiProperty({ description: 'Текст отзыва', maxLength: 2000 })
    @IsString()
    @MaxLength(2000)
    text!: string;

    @ApiProperty({ description: 'Идентификатор товара (опционально)', required: false })
    @IsOptional()
    @IsString()
    productId?: string;
}

/** Тело запроса на модерацию (смена статуса) отзыва. */
export class ModerateReviewDto {
    @ApiProperty({ description: 'Статус модерации', enum: ['published', 'hidden'] })
    @IsEnum(['published', 'hidden'])
    status!: ReviewStatus;
}

/** Swagger-модель отзыва (публичный контракт). */
export class ReviewDto implements ReviewContract {
    @ApiProperty() id!: string;
    @ApiProperty() orderId!: string;
    @ApiProperty() vendorOrderId!: string;
    @ApiProperty() buyerId!: string;
    @ApiProperty() vendorId!: string;
    @ApiProperty({ required: false }) productId?: string;
    @ApiProperty() rating!: number;
    @ApiProperty() text!: string;
    @ApiProperty({ enum: ['published', 'hidden'] }) status!: ReviewStatus;
    @ApiProperty() createdAt!: Date;
    @ApiProperty() updatedAt!: Date;
}

/** Swagger-модель листинга отзывов с агрегатом рейтинга. */
export class ReviewSummaryDto {
    @ApiProperty({ type: [ReviewDto] }) reviews!: ReviewDto[];
    @ApiProperty() ratingAvg!: number;
    @ApiProperty() ratingCount!: number;
}
