import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import type { MediaDescriptor, MediaType } from '../../@types';

/** Мультиязычный текст в DTO. */
export class LocalizedTextDto {
    @ApiProperty({ description: 'Армянский (дефолт)' })
    @IsString()
    hy!: string;

    @ApiProperty({ description: 'Русский' })
    @IsString()
    ru!: string;

    @ApiProperty({ description: 'Английский' })
    @IsString()
    en!: string;
}

/**
 * Дескриптор медиа (обложка/элемент галереи) с метаданными для валидации
 * лимитов платформы (format/sizeBytes/durationSec/width/height опциональны).
 */
export class MediaDto implements MediaDescriptor {
    @ApiProperty({ enum: ['image', 'video'] })
    @IsIn(['image', 'video'])
    mediaType!: MediaType;

    @ApiProperty({ description: 'URL медиа' })
    @IsString()
    @IsUrl({ require_tld: false })
    url!: string;

    @ApiPropertyOptional({ description: 'URL превью' })
    @IsOptional()
    @IsString()
    thumbnailUrl?: string;

    @ApiPropertyOptional({ description: 'Формат файла (jpg/png/mp4...)' })
    @IsOptional()
    @IsString()
    format?: string;

    @ApiPropertyOptional({ description: 'Размер в байтах' })
    @IsOptional()
    @IsInt()
    @Min(0)
    sizeBytes?: number;

    @ApiPropertyOptional({ description: 'Длительность видео в секундах' })
    @IsOptional()
    @IsNumber()
    @Min(0)
    durationSec?: number;

    @ApiPropertyOptional({ description: 'Ширина в пикселях' })
    @IsOptional()
    @IsInt()
    @Min(0)
    width?: number;

    @ApiPropertyOptional({ description: 'Высота в пикселях' })
    @IsOptional()
    @IsInt()
    @Min(0)
    height?: number;
}

/** Атрибут товара (ключ-значение). */
export class AttributeDto {
    @ApiProperty()
    @IsString()
    key!: string;

    @ApiProperty()
    @IsString()
    value!: string;
}

/** Скидка на товар. */
export class DiscountDto {
    @ApiProperty({ enum: ['percent', 'amount'] })
    @IsIn(['percent', 'amount'])
    type!: 'percent' | 'amount';

    @ApiProperty({ description: 'Значение скидки' })
    @IsNumber()
    @Min(0)
    value!: number;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsOptional()
    activeFrom?: Date;

    @ApiPropertyOptional({ type: String, format: 'date-time' })
    @IsOptional()
    activeTo?: Date;
}
