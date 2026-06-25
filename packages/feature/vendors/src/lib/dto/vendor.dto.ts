import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { VendorContract, VendorStatus } from '../../@types';

/** Тело создания вендора (онбординг/админ; ownerUserId передаётся вызывающим). */
export class CreateVendorDto {
    @ApiProperty({ description: 'Уникальный slug' })
    @IsString()
    @IsNotEmpty()
    slug!: string;

    @ApiProperty({ description: 'Название вендора' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ description: 'Отображаемое имя', required: false })
    @IsOptional()
    @IsString()
    display?: string;

    @ApiProperty({ description: 'Регион' })
    @IsString()
    @IsNotEmpty()
    region!: string;

    @ApiProperty({ description: 'Город', required: false })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiProperty({ description: 'Логотип (URL)', required: false })
    @IsOptional()
    @IsString()
    logo?: string;
}

/** Тело обновления профиля вендора владельцем (только разрешённые поля). */
export class UpdateVendorDto {
    @ApiProperty({ description: 'Название вендора', required: false })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    name?: string;

    @ApiProperty({ description: 'Отображаемое имя', required: false })
    @IsOptional()
    @IsString()
    display?: string;

    @ApiProperty({ description: 'Регион', required: false })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    region?: string;

    @ApiProperty({ description: 'Город', required: false })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiProperty({ description: 'Логотип (URL)', required: false, maxLength: 2048 })
    @IsOptional()
    @IsString()
    @MaxLength(2048)
    logo?: string;
}

/** Swagger-модель вендора (публичный контракт). */
export class VendorDto implements VendorContract {
    @ApiProperty() id!: string;
    @ApiProperty() slug!: string;
    @ApiProperty() name!: string;
    @ApiProperty({ required: false }) display?: string;
    @ApiProperty() ownerUserId!: string;
    @ApiProperty() region!: string;
    @ApiProperty({ required: false }) city?: string;
    @ApiProperty({ enum: ['active', 'suspended'] }) status!: VendorStatus;
    @ApiProperty() ratingAvg!: number;
    @ApiProperty() ratingCount!: number;
    @ApiProperty({ required: false }) logo?: string;
    @ApiProperty() createdAt!: Date;
    @ApiProperty() updatedAt!: Date;
}
