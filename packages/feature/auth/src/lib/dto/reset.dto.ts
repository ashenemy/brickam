import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

/** Сброс пароля по OTP. */
export class ResetDto {
    @ApiProperty({ example: '+37412345678' })
    @Matches(/^\+374\d{8}$/, { message: 'errors.auth.invalidPhone' })
    phone!: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    @IsNotEmpty()
    code!: string;

    @ApiProperty({ example: 'newsecret123', minLength: 8 })
    @IsString()
    @MinLength(8)
    newPassword!: string;
}
