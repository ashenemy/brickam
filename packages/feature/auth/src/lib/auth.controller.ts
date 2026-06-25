import { AppConfigService } from '@brickam/config-kit';
import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import type {
    ForgotResult,
    LoginResult,
    RefreshResult,
    RegisterResult,
    ResetResult,
    VerifyOtpResult,
} from '../@types';
import { AuthService } from './auth.service';
import { clearAuthCookies, setAuthCookies } from './auth-cookies.util';
import { Public } from './decorators/public.decorator';
import { ForgotDto } from './dto/forgot.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetDto } from './dto/reset.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

/** HTTP-эндпоинты аутентификации. Все маршруты публичные. Строгий rate-limit
 * (защита от перебора паролей/OTP): 20 запросов в минуту на IP. */
@ApiTags('auth')
@Controller('auth')
@Throttle({ default: { ttl: 60_000, limit: 20 } })
export class AuthController {
    constructor(
        private readonly auth: AuthService,
        private readonly config: AppConfigService,
    ) {}

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
    async verifyOtp(
        @Body() dto: VerifyOtpDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<VerifyOtpResult> {
        const result = await this.auth.verifyOtp(dto);
        setAuthCookies(res, result.tokens, this.config.isProduction);
        return result;
    }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Вход по телефону и паролю' })
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<LoginResult> {
        const result = await this.auth.login(dto);
        if ('tokens' in result && result.tokens) {
            setAuthCookies(res, result.tokens, this.config.isProduction);
        }
        return result;
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Обновление пары токенов (ротация refresh)' })
    async refresh(
        @Body() dto: RefreshDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<RefreshResult> {
        const result = await this.auth.refresh(dto);
        setAuthCookies(res, result.tokens, this.config.isProduction);
        return result;
    }

    @Public()
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Выход — очищает httpOnly-cookie с токенами' })
    logout(@Res({ passthrough: true }) res: Response): { success: true } {
        clearAuthCookies(res);
        return { success: true };
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
