import { ForbiddenException } from '@brickam/core-kit';
import { Role } from '@brickam/domain-kit';
import {
    Auth,
    type AuthUser,
    CurrentUser,
    CurrentVendor,
    type VendorContext,
} from '@brickam/server-kit';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { VendorMemberContract } from '../@types';
import { AddMemberDto, UpdateMemberDto, VendorMemberDto } from './dto/vendor-member.dto';
import { VendorMembersService } from './vendor-members.service';

/**
 * Маршруты управления командой вендора (Foundations §14, Stage 15).
 * Все операции — только владельцем (`vendor_owner`) своего вендора.
 */
@ApiTags('vendor-members')
@Controller('vendor-members')
export class VendorMembersController {
    constructor(private readonly membersService: VendorMembersService) {}

    /**
     * Проверяет, что запросчик — владелец целевого вендора: его vendorId совпадает
     * с контекстным И роль === vendor_owner. Возвращает vendorId владельца.
     */
    private requireOwner(user: AuthUser | undefined, vendor: VendorContext | undefined): string {
        if (
            !user ||
            !vendor ||
            user.vendorId !== vendor.id ||
            user.role !== (Role.VendorOwner as string)
        ) {
            throw new ForbiddenException('errors.members.notOwner');
        }
        return vendor.id;
    }

    /** Список членов команды своего вендора. */
    @Get()
    @Auth()
    @ApiOkResponse({ type: [VendorMemberDto], description: 'Команда вендора' })
    list(
        @CurrentUser() user: AuthUser | undefined,
        @CurrentVendor() vendor: VendorContext | undefined,
    ): Promise<VendorMemberContract[]> {
        const vendorId = this.requireOwner(user, vendor);
        return this.membersService.listMembers(vendorId);
    }

    /** Добавляет суб-аккаунт по телефону с набором прав. */
    @Post()
    @Auth()
    @ApiOkResponse({ type: VendorMemberDto, description: 'Добавленный член команды' })
    add(
        @CurrentUser() user: AuthUser | undefined,
        @CurrentVendor() vendor: VendorContext | undefined,
        @Body() dto: AddMemberDto,
    ): Promise<VendorMemberContract> {
        const vendorId = this.requireOwner(user, vendor);
        return this.membersService.addMember(vendorId, dto.phone, dto.permissions);
    }

    /** Меняет права суб-аккаунта. */
    @Patch(':userId')
    @Auth()
    @ApiOkResponse({ type: VendorMemberDto, description: 'Обновлённый член команды' })
    update(
        @CurrentUser() user: AuthUser | undefined,
        @CurrentVendor() vendor: VendorContext | undefined,
        @Param('userId') userId: string,
        @Body() dto: UpdateMemberDto,
    ): Promise<VendorMemberContract> {
        const vendorId = this.requireOwner(user, vendor);
        return this.membersService.updateMember(vendorId, userId, dto.permissions);
    }

    /** Удаляет суб-аккаунт из команды. */
    @Delete(':userId')
    @Auth()
    @ApiOkResponse({ description: 'Член команды удалён' })
    remove(
        @CurrentUser() user: AuthUser | undefined,
        @CurrentVendor() vendor: VendorContext | undefined,
        @Param('userId') userId: string,
    ): Promise<void> {
        const vendorId = this.requireOwner(user, vendor);
        return this.membersService.removeMember(vendorId, userId);
    }
}
