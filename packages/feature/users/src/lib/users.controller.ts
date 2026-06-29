import { NotFoundException } from '@brickam/core-kit';
import type { UserContract } from '@brickam/domain-kit';
import { Auth, CurrentUser } from '@brickam/server-kit';
import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

/** Маршруты пользователей: профиль текущего пользователя + редактирование. */
@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    /** Возвращает профиль аутентифицированного пользователя. */
    @Get('me')
    @Auth()
    @ApiOkResponse({ description: 'Профиль текущего пользователя' })
    async me(@CurrentUser('id') userId: string): Promise<UserContract> {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new NotFoundException();
        }
        return user;
    }

    /** Обновляет профиль (имя/язык/тип аккаунта) текущего пользователя. */
    @Patch('me')
    @Auth()
    @ApiOperation({ summary: 'Обновить профиль текущего пользователя' })
    update(
        @CurrentUser('id') userId: string,
        @Body() dto: UpdateProfileDto,
    ): Promise<UserContract> {
        return this.usersService.updateProfile(userId, dto);
    }

    /** Смена пароля текущего пользователя (проверяет текущий пароль). */
    @Post('me/password')
    @Auth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Сменить пароль текущего пользователя' })
    async changePassword(
        @CurrentUser('id') userId: string,
        @Body() dto: ChangePasswordDto,
    ): Promise<{ success: true }> {
        await this.usersService.changePassword(userId, dto);
        return { success: true };
    }
}
