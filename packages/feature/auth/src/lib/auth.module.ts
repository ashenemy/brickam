import { TokenVerifierContract } from '@brickam/domain-kit';
import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';

/**
 * Модуль аутентификации. Guard'ы регистрируются глобально через APP_GUARD:
 * сначала JwtAuthGuard (аутентификация), затем PermissionsGuard (авторизация).
 * UsersServiceContract инжектится из глобального users-модуля (тут не объявляется).
 */
@Global()
@Module({
    imports: [JwtModule.register({})],
    controllers: [AuthController],
    providers: [
        OtpService,
        TokenService,
        AuthService,
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: PermissionsGuard },
        // Контракт верификации токена для WS-gateway чата (граница feature).
        { provide: TokenVerifierContract, useExisting: TokenService },
    ],
    exports: [TokenService, AuthService, TokenVerifierContract],
})
export class AuthModule {}
