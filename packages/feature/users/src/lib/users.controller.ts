import { NotFoundException } from '@brickam/core-kit';
import type { UserContract } from '@brickam/domain-kit';
import { Auth, CurrentUser } from '@brickam/server-kit';
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

/** Маршруты пользователей. Пока только профиль текущего пользователя. */
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
}
