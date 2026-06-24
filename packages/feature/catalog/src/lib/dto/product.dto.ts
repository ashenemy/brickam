import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';
import { AttributeDto, DiscountDto, LocalizedTextDto, MediaDto } from './media.dto';

/** Создание товара (требует право products.manage). */
export class CreateProductDto {
    @ApiProperty()
    @IsString()
    vendorId!: string;

    @ApiProperty()
    @IsString()
    categoryId!: string;

    @ApiProperty({ description: 'Уникальный slug товара' })
    @IsString()
    slug!: string;

    @ApiProperty({ type: LocalizedTextDto })
    @ValidateNested()
    @Type(() => LocalizedTextDto)
    title!: LocalizedTextDto;

    @ApiProperty({ type: LocalizedTextDto })
    @ValidateNested()
    @Type(() => LocalizedTextDto)
    description!: LocalizedTextDto;

    @ApiProperty({ type: MediaDto })
    @ValidateNested()
    @Type(() => MediaDto)
    cover!: MediaDto;

    @ApiPropertyOptional({ type: [MediaDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MediaDto)
    gallery?: MediaDto[];

    @ApiProperty({ description: 'Базовая цена (целые AMD)' })
    @IsNumber()
    @Min(0)
    price!: number;

    @ApiPropertyOptional({ type: DiscountDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => DiscountDto)
    discount?: DiscountDto;

    @ApiProperty({ description: 'Единица измерения' })
    @IsString()
    unit!: string;

    @ApiPropertyOptional({ description: 'Остаток на складе', default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    stock?: number;

    @ApiProperty({ description: 'Регион' })
    @IsString()
    region!: string;

    @ApiPropertyOptional({ type: [AttributeDto] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AttributeDto)
    attributes?: AttributeDto[];
}

/** Частичное обновление товара. */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
