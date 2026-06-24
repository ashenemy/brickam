import type { Page } from '@brickam/core-kit';
import { Auth, PaginationQueryDto } from '@brickam/server-kit';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import type { Template } from './template.schema';
import { TemplatesService } from './templates.service';

/**
 * Админский CRUD по шаблонам (Foundations §10). Доступ ограничивает
 * PermissionsGuard (подключается в Stage 2); здесь — только `@Auth()` метаданные.
 */
@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
    constructor(private readonly templatesService: TemplatesService) {}

    /** Список шаблонов с пагинацией. */
    @Get()
    @Auth()
    @ApiOkResponse({ description: 'Страница шаблонов' })
    findAll(@Query() query: PaginationQueryDto): Promise<Page<Template>> {
        return this.templatesService.findAll(query);
    }

    /** Один шаблон по ключу. */
    @Get(':key')
    @Auth()
    @ApiOkResponse({ description: 'Шаблон по ключу' })
    findByKey(@Param('key') key: string): Promise<Template> {
        return this.templatesService.findByKey(key);
    }

    /** Создаёт шаблон. */
    @Post()
    @Auth()
    @ApiOkResponse({ description: 'Созданный шаблон' })
    create(@Body() dto: CreateTemplateDto): Promise<Template> {
        return this.templatesService.create(dto);
    }

    /** Обновляет шаблон по ключу. */
    @Patch(':key')
    @Auth()
    @ApiOkResponse({ description: 'Обновлённый шаблон' })
    update(@Param('key') key: string, @Body() dto: UpdateTemplateDto): Promise<Template> {
        return this.templatesService.updateByKey(key, dto);
    }

    /** Удаляет шаблон по ключу. */
    @Delete(':key')
    @Auth()
    @ApiOkResponse({ description: 'Удалённый ключ' })
    async remove(@Param('key') key: string): Promise<{ key: string }> {
        await this.templatesService.removeByKey(key);
        return { key };
    }
}
