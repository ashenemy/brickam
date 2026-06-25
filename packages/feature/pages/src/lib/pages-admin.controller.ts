import { ForbiddenException } from '@brickam/core-kit';
import { Role } from '@brickam/domain-kit';
import { Auth, type AuthUser, CurrentUser } from '@brickam/server-kit';
import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { PageContract } from '../@types';
import { PageDto, UpsertPageDto } from './dto/page.dto';
import { PagesService } from './pages.service';

/** Бросает Forbidden, если пользователь не админ. */
function requireAdmin(user: AuthUser): void {
    if (user.role !== Role.Admin) {
        throw new ForbiddenException('errors.admin.notAdmin');
    }
}

/** Админ-маршруты CMS-страниц (Foundations §15). Только админ. */
@ApiTags('admin')
@Controller('admin/pages')
@Auth()
export class PagesAdminController {
    constructor(private readonly pagesService: PagesService) {}

    /** Все страницы (любой статус). */
    @Get()
    @ApiOkResponse({ type: [PageDto], description: 'Все страницы' })
    adminList(@CurrentUser() user: AuthUser): Promise<PageContract[]> {
        requireAdmin(user);
        return this.pagesService.adminList();
    }

    /** Одна страница по slug (любой статус). */
    @Get(':slug')
    @ApiOkResponse({ type: PageDto, description: 'Страница' })
    adminGet(@CurrentUser() user: AuthUser, @Param('slug') slug: string): Promise<PageContract> {
        requireAdmin(user);
        return this.pagesService.adminGet(slug);
    }

    /** Создаёт/обновляет страницу по slug. */
    @Put(':slug')
    @ApiOkResponse({ type: PageDto, description: 'Сохранённая страница' })
    upsert(
        @CurrentUser() user: AuthUser,
        @Param('slug') slug: string,
        @Body() dto: UpsertPageDto,
    ): Promise<PageContract> {
        requireAdmin(user);
        return this.pagesService.upsert(slug, dto, user.id);
    }

    /** Удаляет страницу по slug. */
    @Delete(':slug')
    @ApiOkResponse({ description: 'Страница удалена' })
    remove(@CurrentUser() user: AuthUser, @Param('slug') slug: string): Promise<void> {
        requireAdmin(user);
        return this.pagesService.remove(slug, user.id);
    }
}
