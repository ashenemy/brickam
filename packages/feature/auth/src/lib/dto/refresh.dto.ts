import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** Обновление пары токенов по refresh-токену. */
export class RefreshDto {
    @ApiProperty({ description: 'Refresh-токен' })
    @IsString()
    @IsNotEmpty()
    refreshToken!: string;
}
