import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import type { DeliveryAddressSnapshot } from '../../@types';

/** Адрес доставки для оформления заказа. */
export class CheckoutAddressDto implements DeliveryAddressSnapshot {
    @ApiProperty({ description: 'Метка адреса' })
    @IsString()
    label!: string;

    @ApiProperty({ description: 'Регион' })
    @IsString()
    region!: string;

    @ApiProperty({ description: 'Город' })
    @IsString()
    city!: string;

    @ApiProperty({ description: 'Адрес, строка 1' })
    @IsString()
    line1!: string;

    @ApiPropertyOptional({ description: 'Адрес, строка 2' })
    @IsOptional()
    @IsString()
    line2?: string;

    @ApiProperty({ description: 'Телефон' })
    @IsString()
    phone!: string;
}

/** Оформление заказа из корзины. */
export class CheckoutDto {
    @ApiProperty({ type: CheckoutAddressDto, description: 'Адрес доставки' })
    @ValidateNested()
    @Type(() => CheckoutAddressDto)
    deliveryAddress!: CheckoutAddressDto;
}
