import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

/** Добавление позиции в корзину. */
export class AddCartItemDto {
    @ApiProperty({ description: 'Идентификатор товара' })
    @IsString()
    productId!: string;

    @ApiProperty({ description: 'Количество', minimum: 1 })
    @IsInt()
    @Min(1)
    qty!: number;
}

/** Установка количества позиции в корзине. */
export class SetQtyDto {
    @ApiProperty({ description: 'Количество', minimum: 1 })
    @IsInt()
    @Min(1)
    qty!: number;
}
