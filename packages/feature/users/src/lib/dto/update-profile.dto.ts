import { AccountType } from '@brickam/domain-kit';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Обновление профиля текущего покупателя. Все поля опциональны — патчим только
 * присланные. Меняем безопасные поля: имя, язык интерфейса, тип аккаунта.
 * Телефон/роль/статус правятся отдельными флоу (verify-otp, админка).
 */
export class UpdateProfileDto {
    @ApiProperty({ example: 'Արամ Պետրոսյան', required: false })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(120)
    name?: string;

    @ApiProperty({ enum: ['hy', 'ru', 'en'], example: 'hy', required: false })
    @IsOptional()
    @IsIn(['hy', 'ru', 'en'])
    lang?: string;

    @ApiProperty({ enum: AccountType, required: false })
    @IsOptional()
    @IsEnum(AccountType)
    accountType?: AccountType;
}
