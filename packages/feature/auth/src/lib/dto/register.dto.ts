import { AccountType, Role } from '@brickam/domain-kit';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';

/** Регистрация: телефон Армении + пароль + роль (Buyer | VendorOwner). */
export class RegisterDto {
    @ApiProperty({ example: '+37412345678', description: 'Телефон Армении (+374XXXXXXXX)' })
    @Matches(/^\+374\d{8}$/, { message: 'errors.auth.invalidPhone' })
    phone!: string;

    @ApiProperty({ example: 'secret123', minLength: 8 })
    @IsString()
    @MinLength(8)
    password!: string;

    @ApiProperty({ example: 'Արամ' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ enum: [Role.Buyer, Role.VendorOwner], example: Role.Buyer })
    @IsEnum(Role)
    role!: Role.Buyer | Role.VendorOwner;

    @ApiProperty({ enum: AccountType, required: false })
    @IsOptional()
    @IsEnum(AccountType)
    accountType?: AccountType;
}
