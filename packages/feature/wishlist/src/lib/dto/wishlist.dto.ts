import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import type { WishlistItem } from '../../@types';

/** Тело запроса на добавление товара в вишлист. */
export class AddWishlistItemDto {
    @ApiProperty({ description: 'Идентификатор товара' })
    @IsString()
    @IsNotEmpty()
    productId!: string;
}

/** Swagger-модель позиции вишлиста. */
export class WishlistItemDto implements WishlistItem {
    @ApiProperty() productId!: string;
    @ApiProperty() addedAt!: Date;
}

/** Swagger-модель ответа вишлиста: позиции и их количество. */
export class WishlistViewDto {
    @ApiProperty({ type: [WishlistItemDto] }) items!: WishlistItemDto[];
    @ApiProperty() count!: number;
}
