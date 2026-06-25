import { ForbiddenException } from '@brickam/core-kit';
import { AuditServiceContract, type RenderedTemplate, Role } from '@brickam/domain-kit';
import type { AuthUser } from '@brickam/server-kit';
import { Auth, CurrentUser } from '@brickam/server-kit';
import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PreviewTemplateDto, UpsertTemplateDto } from './dto/template.dto';
import type { Template } from './template.schema';
import { TemplatesService } from './templates.service';

/**
 * Админ-редактор шаблонов (Foundations §10/§15, Stage 17). Гейтит доступ по
 * `Role.Admin`; CRUD-операции пишут аудит через `AuditServiceContract`.
 */
@ApiTags('admin-templates')
@Controller('admin/templates')
export class TemplatesAdminController {
    constructor(
        private readonly templatesService: TemplatesService,
        private readonly audit: AuditServiceContract,
    ) {}

    /** Список всех шаблонов для редактора. */
    @Get()
    @Auth()
    @ApiOkResponse({ description: 'Список шаблонов' })
    list(@CurrentUser() user: AuthUser): Promise<Template[]> {
        this.requireAdmin(user);
        return this.templatesService.list();
    }

    /** Шаблон по ключу (без проверки активности). */
    @Get(':key')
    @Auth()
    @ApiOkResponse({ description: 'Шаблон по ключу' })
    getByKey(@CurrentUser() user: AuthUser, @Param('key') key: string): Promise<Template> {
        this.requireAdmin(user);
        return this.templatesService.findByKey(key);
    }

    /** Создаёт/обновляет шаблон по ключу + аудит. */
    @Put(':key')
    @Auth()
    @ApiOkResponse({ description: 'Сохранённый шаблон' })
    async upsert(
        @CurrentUser() user: AuthUser,
        @Param('key') key: string,
        @Body() dto: UpsertTemplateDto,
    ): Promise<Template> {
        this.requireAdmin(user);
        const saved = await this.templatesService.upsert(key, dto);
        await this.audit.record({
            actorId: user.id,
            action: 'template.save',
            targetType: 'template',
            targetId: key,
        });
        return saved;
    }

    /** Превью рендера с подстановкой переданных переменных. */
    @Post(':key/preview')
    @Auth()
    @ApiOkResponse({ description: 'Отрендеренный шаблон {subject?, body}' })
    preview(
        @CurrentUser() user: AuthUser,
        @Param('key') key: string,
        @Body() dto: PreviewTemplateDto,
    ): Promise<RenderedTemplate> {
        this.requireAdmin(user);
        return this.templatesService.previewRender(key, dto.lang, dto.vars);
    }

    /** Гейт админ-доступа: не админ → Forbidden 'errors.admin.notAdmin'. */
    private requireAdmin(user: AuthUser): void {
        if (user.role !== Role.Admin) {
            throw new ForbiddenException('errors.admin.notAdmin');
        }
    }
}
