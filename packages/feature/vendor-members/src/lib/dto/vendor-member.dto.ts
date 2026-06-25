import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsIn, IsNotEmpty, IsString } from 'class-validator';
import type { VendorMemberContract } from '../../@types';

/** Допустимые коды прав суб-аккаунта (подмножество Permission). */
const PERMISSION_CODES = [
    'orders.view',
    'products.manage',
    'analytics.view',
    'chat.handle',
    'invoices.create',
];

/** Тело добавления суб-аккаунта по телефону. */
export class AddMemberDto {
    @ApiProperty({ description: 'Телефон пользователя' })
    @IsString()
    @IsNotEmpty()
    phone!: string;

    @ApiProperty({ description: 'Набор прав', isArray: true, enum: PERMISSION_CODES })
    @IsArray()
    @ArrayUnique()
    @IsIn(PERMISSION_CODES, { each: true })
    permissions!: string[];
}

/** Тело обновления прав суб-аккаунта. */
export class UpdateMemberDto {
    @ApiProperty({ description: 'Набор прав', isArray: true, enum: PERMISSION_CODES })
    @IsArray()
    @ArrayUnique()
    @IsIn(PERMISSION_CODES, { each: true })
    permissions!: string[];
}

/** Swagger-модель члена команды (публичный контракт). */
export class VendorMemberDto implements VendorMemberContract {
    @ApiProperty() id!: string;
    @ApiProperty() vendorId!: string;
    @ApiProperty() userId!: string;
    @ApiProperty() role!: string;
    @ApiProperty({ isArray: true, type: String }) permissions!: string[];
    @ApiProperty() createdAt!: Date;
    @ApiProperty() updatedAt!: Date;
}
