import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsDateString,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';
import type {
    InvoiceContract,
    InvoiceDiscount,
    InvoiceDiscountType,
    InvoiceLineItem,
    InvoiceStatus,
} from '../../@types';

/** Позиция инвойса в теле запроса. */
export class InvoiceLineItemDto implements InvoiceLineItem {
    @ApiProperty({ description: 'Название позиции' })
    @IsString()
    @IsNotEmpty()
    title!: string;

    @ApiProperty({ description: 'Количество', minimum: 1 })
    @IsInt()
    @Min(1)
    qty!: number;

    @ApiProperty({ description: 'Цена за единицу (целые AMD)', minimum: 0 })
    @IsInt()
    @Min(0)
    price!: number;
}

/** Скидка инвойса в теле запроса. */
export class InvoiceDiscountDto implements InvoiceDiscount {
    @ApiProperty({ description: 'Тип скидки', enum: ['percent', 'amount'] })
    @IsEnum(['percent', 'amount'])
    type!: InvoiceDiscountType;

    @ApiProperty({ description: 'Значение скидки' })
    @IsInt()
    @Min(0)
    value!: number;
}

/** Тело запроса на создание инвойса (vendorId берётся из контекста продавца). */
export class CreateInvoiceDto {
    @ApiProperty({ description: 'Идентификатор диалога (чата)' })
    @IsString()
    @IsNotEmpty()
    chatId!: string;

    @ApiProperty({ description: 'Идентификатор покупателя' })
    @IsString()
    @IsNotEmpty()
    buyerId!: string;

    @ApiProperty({ description: 'Позиции инвойса', type: [InvoiceLineItemDto] })
    @ValidateNested({ each: true })
    @Type(() => InvoiceLineItemDto)
    @ArrayMinSize(1)
    lineItems!: InvoiceLineItemDto[];

    @ApiProperty({ description: 'Скидка (опционально)', required: false, type: InvoiceDiscountDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => InvoiceDiscountDto)
    discount?: InvoiceDiscountDto;

    @ApiProperty({ description: 'Срок действия (ISO 8601)' })
    @IsDateString()
    validUntil!: string;

    @ApiProperty({ description: 'Валюта (по умолчанию — baseCurrency)', required: false })
    @IsOptional()
    @IsString()
    currency?: string;
}

/** Swagger-модель инвойса (публичный контракт). */
export class InvoiceDto implements InvoiceContract {
    @ApiProperty() id!: string;
    @ApiProperty() invoiceNumber!: string;
    @ApiProperty() chatId!: string;
    @ApiProperty() vendorId!: string;
    @ApiProperty() buyerId!: string;
    @ApiProperty({ type: [InvoiceLineItemDto] }) lineItems!: InvoiceLineItem[];
    @ApiProperty({ required: false, type: InvoiceDiscountDto }) discount?: InvoiceDiscount;
    @ApiProperty() subtotal!: number;
    @ApiProperty() total!: number;
    @ApiProperty() currency!: string;
    @ApiProperty() validUntil!: Date;
    @ApiProperty({ enum: ['draft', 'sent', 'paid', 'expired', 'cancelled'] })
    status!: InvoiceStatus;
    @ApiProperty({ required: false }) orderId?: string;
    @ApiProperty({ required: false }) pdfUrl?: string;
    @ApiProperty() createdAt!: Date;
    @ApiProperty() updatedAt!: Date;
}
