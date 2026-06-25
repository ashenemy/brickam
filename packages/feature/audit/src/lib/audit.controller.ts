import { ForbiddenException } from '@brickam/core-kit';
import { Role } from '@brickam/domain-kit';
import { Auth, type AuthUser, CurrentUser } from '@brickam/server-kit';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { AuditLogView } from '../@types';
import { AuditService } from './audit.service';
import { AuditLogDto } from './dto/audit.dto';

/** Лимит записей по умолчанию для листинга аудита. */
const DEFAULT_AUDIT_LIMIT = 50;

/** Маршруты аудит-лога (Foundations §15, Stage 17). Только админ. */
@ApiTags('audit')
@Controller('audit')
export class AuditController {
    constructor(private readonly auditService: AuditService) {}

    /** Последние записи аудита (только админ). */
    @Get()
    @Auth()
    @ApiOkResponse({ type: [AuditLogDto], description: 'Последние записи аудита' })
    list(@CurrentUser() user: AuthUser, @Query('limit') limit?: string): Promise<AuditLogView[]> {
        if (user.role !== Role.Admin) {
            throw new ForbiddenException('errors.audit.notAdmin');
        }
        const parsed = limit !== undefined ? Number.parseInt(limit, 10) : DEFAULT_AUDIT_LIMIT;
        const effective = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_AUDIT_LIMIT;
        return this.auditService.list(effective);
    }
}
