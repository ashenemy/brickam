import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
    ForgotResult,
    LoginResult,
    RefreshResult,
    RegisterResult,
    ResetResult,
    VerifyOtpResult,
} from '../@types';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { ForgotDto } from './dto/forgot.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetDto } from './dto/reset.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

/** HTTP-эндпоинты аутентификации. Все маршруты публичные. */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) {}

    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Регистрация (телефон + пароль), отправляет OTP' })
    register(@Body() dto: RegisterDto): Promise<RegisterResult> {
        return this.auth.register(dto);
    }

    @Public()
    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Подтверждение телефона по OTP, выдаёт токены' })
    verifyOtp(@Body() dto: VerifyOtpDto): Promise<VerifyOtpResult> {
        return this.auth.verifyOtp(dto);
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Вход по телефону и паролю' })
    login(@Body() dto: LoginDto): Promise<LoginResult> {
        return this.auth.login(dto);
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Обновление пары токенов (ротация refresh)' })
    refresh(@Body() dto: RefreshDto): Promise<RefreshResult> {
        return this.auth.refresh(dto);
    }

    @Public()
    @Post('forgot')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Запрос сброса пароля (отправляет OTP)' })
    forgot(@Body() dto: ForgotDto): Promise<ForgotResult> {
        return this.auth.forgot(dto);
    }

    @Public()
    @Post('reset')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Сброс пароля по OTP' })
    reset(@Body() dto: ResetDto): Promise<ResetResult> {
        return this.auth.reset(dto);
    }
}
