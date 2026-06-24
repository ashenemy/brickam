import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

/** Подтверждение телефона по OTP. */
export class VerifyOtpDto {
    @ApiProperty({ example: '+37412345678' })
    @Matches(/^\+374\d{8}$/, { message: 'errors.auth.invalidPhone' })
    phone!: string;

    @ApiProperty({ example: '123456', description: 'OTP-код' })
    @IsString()
    @IsNotEmpty()
    code!: string;

    @ApiProperty({ required: false, description: 'Идентификатор устройства' })
    @IsOptional()
    @IsString()
    deviceId?: string;
}
