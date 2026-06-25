import { ForbiddenException } from '@brickam/core-kit';
import { AuditServiceContract, Role } from '@brickam/domain-kit';
import type { AuthUser } from '@brickam/server-kit';
import { Auth, CurrentUser } from '@brickam/server-kit';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CreateProgramDto, UpdateProgramDto } from './dto/loyalty.dto';
import { LoyaltyService } from './loyalty.service';
import type { LoyaltyProgramDocument } from './loyalty-program.schema';

/**
 * Админ-конструктор программ лояльности (Foundations §11/§15, Stage 17). Гейтит
 * доступ по `Role.Admin`; пишет аудит через `AuditServiceContract`. Активация
 * оставляет ровно одну активную программу.
 */
@ApiTags('admin-loyalty')
@Controller('admin/loyalty/programs')
export class LoyaltyAdminController {
    constructor(
        private readonly loyaltyService: LoyaltyService,
        private readonly audit: AuditServiceContract,
    ) {}

    /** Список всех программ. */
    @Get()
    @Auth()
    @ApiOkResponse({ description: 'Список программ лояльности' })
    list(@CurrentUser() user: AuthUser): Promise<LoyaltyProgramDocument[]> {
        this.requireAdmin(user);
        return this.loyaltyService.listPrograms();
    }

    /** Создаёт программу (не активна) + аудит. */
    @Post()
    @Auth()
    @ApiOkResponse({ description: 'Созданная программа' })
    async create(
        @CurrentUser() user: AuthUser,
        @Body() dto: CreateProgramDto,
    ): Promise<LoyaltyProgramDocument> {
        this.requireAdmin(user);
        const created = await this.loyaltyService.createProgram(dto);
        await this.audit.record({
            actorId: user.id,
            action: 'loyalty.create',
            targetType: 'loyalty_program',
            targetId: created.id,
        });
        return created;
    }

    /** Обновляет программу по id + аудит. */
    @Patch(':id')
    @Auth()
    @ApiOkResponse({ description: 'Обновлённая программа' })
    async update(
        @CurrentUser() user: AuthUser,
        @Param('id') id: string,
        @Body() dto: UpdateProgramDto,
    ): Promise<LoyaltyProgramDocument> {
        this.requireAdmin(user);
        const updated = await this.loyaltyService.updateProgram(id, dto);
        await this.audit.record({
            actorId: user.id,
            action: 'loyalty.update',
            targetType: 'loyalty_program',
            targetId: id,
        });
        return updated;
    }

    /** Активирует программу (ровно одна active) + аудит. */
    @Post(':id/activate')
    @Auth()
    @ApiOkResponse({ description: 'Активированная программа' })
    async activate(
        @CurrentUser() user: AuthUser,
        @Param('id') id: string,
    ): Promise<LoyaltyProgramDocument> {
        this.requireAdmin(user);
        const activated = await this.loyaltyService.activateProgram(id);
        await this.audit.record({
            actorId: user.id,
            action: 'loyalty.activate',
            targetType: 'loyalty_program',
            targetId: id,
        });
        return activated;
    }

    /** Гейт админ-доступа: не админ → Forbidden 'errors.admin.notAdmin'. */
    private requireAdmin(user: AuthUser): void {
        if (user.role !== Role.Admin) {
            throw new ForbiddenException('errors.admin.notAdmin');
        }
    }
}
