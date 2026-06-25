import { ForbiddenException } from '@brickam/core-kit';
import { Role } from '@brickam/domain-kit';
import { Auth, type AuthUser, CurrentUser } from '@brickam/server-kit';
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { DisputeContract, DisputeStatus } from '../@types';
import { DisputesService } from './disputes.service';
import { DisputeDto, OpenDisputeDto, ResolveDisputeDto } from './dto/dispute.dto';

/** Бросает Forbidden, если пользователь не админ. */
function requireAdmin(user: AuthUser): void {
    if (user.role !== Role.Admin) {
        throw new ForbiddenException('errors.disputes.notAdmin');
    }
}

/** Маршруты споров (Foundations §15, Stage 17). Открыть может любой авторизованный; разбор/закрытие — админ. */
@ApiTags('disputes')
@Controller('disputes')
export class DisputesController {
    constructor(private readonly disputesService: DisputesService) {}

    /** Открывает спор от имени текущего пользователя. */
    @Post()
    @Auth()
    @ApiOkResponse({ type: DisputeDto, description: 'Открытый спор' })
    open(
        @CurrentUser('id') openedByUserId: string,
        @Body() dto: OpenDisputeDto,
    ): Promise<DisputeContract> {
        return this.disputesService.open(openedByUserId, dto);
    }

    /** Список споров (только админ, опционально по статусу). */
    @Get()
    @Auth()
    @ApiOkResponse({ type: [DisputeDto], description: 'Список споров' })
    list(
        @CurrentUser() user: AuthUser,
        @Query('status') status?: DisputeStatus,
    ): Promise<DisputeContract[]> {
        requireAdmin(user);
        return this.disputesService.list(status);
    }

    /** Один спор по id (только админ). */
    @Get(':id')
    @Auth()
    @ApiOkResponse({ type: DisputeDto, description: 'Спор' })
    get(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<DisputeContract> {
        requireAdmin(user);
        return this.disputesService.get(id);
    }

    /** Переводит спор в разбор (только админ). */
    @Patch(':id/review')
    @Auth()
    @ApiOkResponse({ type: DisputeDto, description: 'Спор в разборе' })
    review(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<DisputeContract> {
        requireAdmin(user);
        return this.disputesService.review(id, user.id);
    }

    /** Закрывает спор с решением (только админ). */
    @Patch(':id/resolve')
    @Auth()
    @ApiOkResponse({ type: DisputeDto, description: 'Разрешённый спор' })
    resolve(
        @CurrentUser() user: AuthUser,
        @Param('id') id: string,
        @Body() dto: ResolveDisputeDto,
    ): Promise<DisputeContract> {
        requireAdmin(user);
        return this.disputesService.resolve(id, user.id, dto.resolution);
    }
}
