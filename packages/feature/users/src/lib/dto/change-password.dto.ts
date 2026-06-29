import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

/** Смена пароля из профиля: текущий пароль для проверки + новый (min 8). */
export class ChangePasswordDto {
    @ApiProperty({ example: 'oldsecret123' })
    @IsString()
    @MinLength(8)
    currentPassword!: string;

    @ApiProperty({ example: 'newsecret123', minLength: 8 })
    @IsString()
    @MinLength(8)
    newPassword!: string;
}
