import { PaginationQueryDto } from '@brickam/server-kit';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import type { ProductSort } from '../../@types';

const PRODUCT_SORTS: ProductSort[] = ['price_asc', 'price_desc', 'rating_desc', 'newest'];

/** Query-параметры публичного листинга товаров (расширяет пагинацию). */
export class ProductFilterQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({ description: 'Полнотекстовый поиск' })
    @IsOptional()
    @IsString()
    q?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    vendorId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minRating?: number;

    @ApiPropertyOptional({ description: 'Только товары в наличии' })
    @IsOptional()
    @Transform(({ value }) => value === true || value === 'true' || value === '1')
    @IsBoolean()
    inStock?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    region?: string;

    @ApiPropertyOptional({ enum: PRODUCT_SORTS })
    @IsOptional()
    @IsIn(PRODUCT_SORTS)
    sort?: ProductSort;
}
