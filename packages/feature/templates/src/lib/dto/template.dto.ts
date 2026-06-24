import type { LocalizedText, TemplateType } from '@brickam/domain-kit';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

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

/** Создание шаблона (админ). */
export class CreateTemplateDto {
    @ApiProperty({ description: 'Уникальный ключ шаблона', example: 'auth.otp' })
    @IsString()
    key!: string;

    @ApiProperty({ enum: ['email', 'sms'], description: 'Канал шаблона' })
    @IsIn(['email', 'sms'])
    type!: TemplateType;

    @ApiProperty({ description: 'Человекочитаемое имя' })
    @IsString()
    name!: string;

    @ApiPropertyOptional({ type: LocalizedTextDto, description: 'Тема письма (для email)' })
    @IsOptional()
    @ValidateNested()
    @Type(() => LocalizedTextDto)
    subject?: LocalizedTextDto;

    @ApiProperty({ type: LocalizedTextDto, description: 'Тело шаблона' })
    @ValidateNested()
    @Type(() => LocalizedTextDto)
    content!: LocalizedTextDto;

    @ApiProperty({ type: [String], description: 'Белый список переменных' })
    @IsArray()
    @IsString({ each: true })
    variables!: string[];

    @ApiPropertyOptional({ description: 'Активен ли шаблон', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

/** Частичное обновление шаблона (админ). Ключ менять нельзя. */
export class UpdateTemplateDto {
    @ApiPropertyOptional({ enum: ['email', 'sms'] })
    @IsOptional()
    @IsIn(['email', 'sms'])
    type?: TemplateType;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ type: LocalizedTextDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => LocalizedTextDto)
    subject?: LocalizedTextDto;

    @ApiPropertyOptional({ type: LocalizedTextDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => LocalizedTextDto)
    content?: LocalizedTextDto;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    variables?: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'Кто обновил' })
    @IsOptional()
    @IsString()
    updatedBy?: string;
}
