import type { LocalizedText } from '@brickam/domain-kit';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import type { PageContract, PageStatus } from '../../@types';

/** Мультиязычный текст в DTO. */
export class LocalizedTextDto implements LocalizedText {
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

/** Тело запроса на создание/обновление страницы (админ). */
export class UpsertPageDto {
    @ApiProperty({ type: LocalizedTextDto, description: 'Заголовок по локалям' })
    @ValidateNested()
    @Type(() => LocalizedTextDto)
    title!: LocalizedTextDto;

    @ApiProperty({ type: LocalizedTextDto, description: 'Содержимое (markdown/html) по локалям' })
    @ValidateNested()
    @Type(() => LocalizedTextDto)
    content!: LocalizedTextDto;

    @ApiPropertyOptional({ enum: ['draft', 'published'], description: 'Статус публикации' })
    @IsOptional()
    @IsEnum(['draft', 'published'])
    status?: PageStatus;

    @ApiPropertyOptional({ type: LocalizedTextDto, description: 'SEO-заголовок' })
    @IsOptional()
    @ValidateNested()
    @Type(() => LocalizedTextDto)
    seoTitle?: LocalizedTextDto;

    @ApiPropertyOptional({ type: LocalizedTextDto, description: 'SEO-описание' })
    @IsOptional()
    @ValidateNested()
    @Type(() => LocalizedTextDto)
    seoDescription?: LocalizedTextDto;
}

/** Swagger-модель страницы (публичный контракт). */
export class PageDto implements PageContract {
    @ApiProperty() id!: string;
    @ApiProperty() slug!: string;
    @ApiProperty({ type: LocalizedTextDto }) title!: LocalizedText;
    @ApiProperty({ type: LocalizedTextDto }) content!: LocalizedText;
    @ApiProperty({ enum: ['draft', 'published'] }) status!: PageStatus;
    @ApiPropertyOptional({ type: LocalizedTextDto }) seoTitle?: LocalizedText;
    @ApiPropertyOptional({ type: LocalizedTextDto }) seoDescription?: LocalizedText;
    @ApiProperty() createdAt!: Date;
    @ApiProperty() updatedAt!: Date;
}
