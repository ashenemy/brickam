import { Auth, CurrentUser } from '@brickam/server-kit';
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { WishlistView } from '../@types';
import { AddWishlistItemDto, WishlistViewDto } from './dto/wishlist.dto';
import { WishlistService } from './wishlist.service';

/** Маршруты вишлиста (Foundations §15). Все требуют аутентификации. */
@ApiTags('wishlist')
@Controller('wishlist')
@Auth()
export class WishlistController {
    constructor(private readonly wishlistService: WishlistService) {}

    /** Возвращает вишлист текущего пользователя. */
    @Get()
    @ApiOkResponse({ type: WishlistViewDto, description: 'Вишлист пользователя' })
    list(@CurrentUser('id') userId: string): Promise<WishlistView> {
        return this.wishlistService.list(userId);
    }

    /** Идемпотентно добавляет товар в вишлист текущего пользователя. */
    @Post('items')
    @ApiOkResponse({ type: WishlistViewDto, description: 'Обновлённый вишлист' })
    add(@CurrentUser('id') userId: string, @Body() dto: AddWishlistItemDto): Promise<WishlistView> {
        return this.wishlistService.add(userId, dto.productId);
    }

    /** Идемпотентно убирает товар из вишлиста текущего пользователя. */
    @Delete('items/:productId')
    @ApiOkResponse({ type: WishlistViewDto, description: 'Обновлённый вишлист' })
    remove(
        @CurrentUser('id') userId: string,
        @Param('productId') productId: string,
    ): Promise<WishlistView> {
        return this.wishlistService.remove(userId, productId);
    }
}
