import { ForbiddenException } from '@brickam/core-kit';
import { AuditServiceContract, Role } from '@brickam/domain-kit';
import { Auth, type AuthUser, CurrentUser } from '@brickam/server-kit';
import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { VendorContract } from '../@types';
import { ModerateVendorDto, VendorListQueryDto } from './dto/admin.dto';
import { VendorsService } from './vendors.service';

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
 * Админ-контроллер вендоров (Foundations §17): список + модерация. Все маршруты
 * требуют Role.Admin; модерация пишется в аудит через AuditServiceContract.
 */
@ApiTags('admin')
@Controller('admin/vendors')
@Auth()
export class VendorsAdminController {
    constructor(
        private readonly vendorsService: VendorsService,
        private readonly audit: AuditServiceContract,
    ) {}

    /** Список вендоров для модерации, опц. фильтр по статусу. */
    @Get()
    @ApiOkResponse({ description: 'Список вендоров' })
    async list(
        @CurrentUser() user: AuthUser | undefined,
        @Query() query: VendorListQueryDto,
    ): Promise<VendorContract[]> {
        requireAdmin(user);
        return this.vendorsService.list(query.status);
    }

    /**
     * Модерация вендора: approve → статус 'active', reject → 'suspended'. Пишет
     * аудит 'vendor.moderate' с выбранным действием в meta.
     */
    @Patch(':id/moderate')
    @ApiOkResponse({ description: 'Вендор отмодерирован' })
    async moderate(
        @CurrentUser() user: AuthUser | undefined,
        @Param('id') id: string,
        @Body() dto: ModerateVendorDto,
    ): Promise<VendorContract> {
        const admin = requireAdmin(user);
        const status = dto.action === 'approve' ? 'active' : 'suspended';
        const vendor = await this.vendorsService.setStatus(id, status);
        await this.audit.record({
            actorId: admin.id,
            action: 'vendor.moderate',
            targetType: 'vendor',
            targetId: id,
            meta: { action: dto.action },
        });
        return vendor;
    }
}
