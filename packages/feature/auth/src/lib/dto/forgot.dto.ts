import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

/** Запрос на сброс пароля (отправка OTP). */
export class ForgotDto {
    @ApiProperty({ example: '+37412345678' })
    @Matches(/^\+374\d{8}$/, { message: 'errors.auth.invalidPhone' })
    phone!: string;
}
