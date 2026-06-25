import { ForbiddenException } from '@brickam/core-kit';
import { Auth, CurrentVendor, type VendorContext } from '@brickam/server-kit';
import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { VendorContract } from '../@types';
import { UpdateVendorDto, VendorDto } from './dto/vendor.dto';
import { Public } from './public.decorator';
import { VendorsService } from './vendors.service';

/** 24-символьный hex — признак Mongo ObjectId (иначе трактуем как slug). */
const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

/** Маршруты вендоров (Foundations §15, Stage 15). */
@ApiTags('vendors')
@Controller('vendors')
export class VendorsController {
    constructor(private readonly vendorsService: VendorsService) {}

    /** Кабинет владельца: профиль своего вендора (vendorId из контекста). */
    @Get('me')
    @Auth()
    @ApiOkResponse({ type: VendorDto, description: 'Профиль своего вендора' })
    getMine(@CurrentVendor() vendor: VendorContext | undefined): Promise<VendorContract> {
        if (!vendor) {
            throw new ForbiddenException('errors.vendors.notOwner');
        }
        return this.vendorsService.getMine(vendor.id);
    }

    /** Обновляет профиль своего вендора (только владелец). */
    @Patch('me')
    @Auth()
    @ApiOkResponse({ type: VendorDto, description: 'Обновлённый профиль' })
    updateMine(
        @CurrentVendor() vendor: VendorContext | undefined,
        @Body() dto: UpdateVendorDto,
    ): Promise<VendorContract> {
        if (!vendor) {
            throw new ForbiddenException('errors.vendors.notOwner');
        }
        return this.vendorsService.updateProfile(vendor.id, dto);
    }

    /** Публичный профиль вендора по id или slug. */
    @Get(':idOrSlug')
    @Public()
    @ApiOkResponse({ type: VendorDto, description: 'Публичный профиль вендора' })
    getProfile(@Param('idOrSlug') idOrSlug: string): Promise<VendorContract> {
        return OBJECT_ID_RE.test(idOrSlug)
            ? this.vendorsService.getById(idOrSlug)
            : this.vendorsService.getBySlug(idOrSlug);
    }
}
