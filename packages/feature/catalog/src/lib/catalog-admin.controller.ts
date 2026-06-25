import { ForbiddenException } from '@brickam/core-kit';
import { AuditServiceContract, Role } from '@brickam/domain-kit';
import { Auth, type AuthUser, CurrentUser } from '@brickam/server-kit';
import { Body, Controller, Get, Param, Patch, Put } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CatalogAiService } from './catalog-ai.service';
import { ModerateDto, SaveSettingDto } from './dto/admin.dto';
import { ProductsService } from './products.service';

/**
 * Гейт администратора: только Role.Admin (§17). Иначе Forbidden с messageKey
 * 'errors.admin.notAdmin'.
 */
function requireAdmin(user: AuthUser | undefined): AuthUser {
    if (!user || user.role !== Role.Admin) {
        throw new ForbiddenException('errors.admin.notAdmin');
    }
    return user;
}

/**
 * Админ-контроллер каталога (Foundations §17): настройки платформы (generic
 * key/value) и модерация товаров. Все маршруты требуют Role.Admin; ключевые
 * действия пишутся в аудит через AuditServiceContract.
 */
@ApiTags('admin')
@Controller('admin')
@Auth()
export class CatalogAdminController {
    constructor(
        private readonly platformSettings: CatalogAiService,
        private readonly productsService: ProductsService,
        private readonly audit: AuditServiceContract,
    ) {}

    /** Читает произвольную настройку платформы по ключу (value или null). */
    @Get('settings/:key')
    @ApiOkResponse({ description: 'Значение настройки или null' })
    async getSetting(
        @CurrentUser() user: AuthUser | undefined,
        @Param('key') key: string,
    ): Promise<Record<string, unknown> | null> {
        requireAdmin(user);
        return this.platformSettings.getSetting(key);
    }

    /**
     * Сохраняет/обновляет настройку по ключу (upsert) + пишет аудит. Ключи:
     * 'default' (commission/aiPrompts), 'media' (лимиты), 'seo' (botUserAgents).
     */
    @Put('settings/:key')
    @ApiOkResponse({ description: 'Настройка сохранена' })
    async saveSetting(
        @CurrentUser() user: AuthUser | undefined,
        @Param('key') key: string,
        @Body() dto: SaveSettingDto,
    ): Promise<void> {
        const admin = requireAdmin(user);
        await this.platformSettings.saveSetting(key, dto.value);
        await this.audit.record({
            actorId: admin.id,
            action: 'settings.save',
            targetType: 'setting',
            targetId: key,
        });
    }

    /**
     * Модерация товара: approve → статус 'active', reject → 'hidden'. Пишет
     * аудит 'product.moderate' с выбранным действием в meta.
     */
    @Patch('products/:id/moderate')
    @ApiOkResponse({ description: 'Товар отмодерирован' })
    async moderateProduct(
        @CurrentUser() user: AuthUser | undefined,
        @Param('id') id: string,
        @Body() dto: ModerateDto,
    ): Promise<void> {
        const admin = requireAdmin(user);
        const status = dto.action === 'approve' ? 'active' : 'hidden';
        await this.productsService.setStatus(id, status);
        await this.audit.record({
            actorId: admin.id,
            action: 'product.moderate',
            targetType: 'product',
            targetId: id,
            meta: { action: dto.action },
        });
    }
}
