import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

/** Вход по телефону и паролю. */
export class LoginDto {
    @ApiProperty({ example: '+37412345678' })
    @Matches(/^\+374\d{8}$/, { message: 'errors.auth.invalidPhone' })
    phone!: string;

    @ApiProperty({ example: 'secret123' })
    @IsString()
    @IsNotEmpty()
    password!: string;

    @ApiProperty({ required: false, description: 'Идентификатор устройства' })
    @IsOptional()
    @IsString()
    deviceId?: string;
}
