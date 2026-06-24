import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { LocalizedTextDto } from './media.dto';

/** Создание категории (требует аутентификации). */
export class CreateCategoryDto {
    @ApiProperty({ description: 'Уникальный slug' })
    @IsString()
    slug!: string;

    @ApiPropertyOptional({ description: 'Родительская категория' })
    @IsOptional()
    @IsString()
    parentId?: string;

    @ApiProperty({ type: LocalizedTextDto })
    @ValidateNested()
    @Type(() => LocalizedTextDto)
    name!: LocalizedTextDto;

    @ApiPropertyOptional({ description: 'Иконка' })
    @IsOptional()
    @IsString()
    icon?: string;

    @ApiPropertyOptional({ description: 'Тип калькулятора' })
    @IsOptional()
    @IsString()
    calculatorType?: string;

    @ApiPropertyOptional({ description: 'Порядок вывода', default: 0 })
    @IsOptional()
    @IsInt()
    order?: number;
}

/** Частичное обновление категории. */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
