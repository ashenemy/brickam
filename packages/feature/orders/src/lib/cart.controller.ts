import { Auth, CurrentUser } from '@brickam/server-kit';
import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { CartContract } from '../@types';
import { CartService } from './cart.service';
import { AddCartItemDto, SetQtyDto } from './dto/cart.dto';
import { CartDto } from './dto/response.dto';

/** Маршруты корзины (Foundations §11). buyerId — текущий пользователь. */
@ApiTags('orders')
@Controller('cart')
@Auth()
export class CartController {
    constructor(private readonly cartService: CartService) {}

    /** Текущая корзина покупателя. */
    @Get()
    @ApiOkResponse({ type: CartDto, description: 'Корзина покупателя' })
    getCart(@CurrentUser('id') buyerId: string): Promise<CartContract> {
        return this.cartService.getCart(buyerId);
    }

    /** Добавляет товар в корзину. */
    @Post('items')
    @ApiOkResponse({ type: CartDto, description: 'Обновлённая корзина' })
    addItem(
        @CurrentUser('id') buyerId: string,
        @Body() dto: AddCartItemDto,
    ): Promise<CartContract> {
        return this.cartService.addItem(buyerId, dto.productId, dto.qty);
    }

    /** Меняет количество позиции. */
    @Patch('items/:productId')
    @ApiOkResponse({ type: CartDto, description: 'Обновлённая корзина' })
    setQty(
        @CurrentUser('id') buyerId: string,
        @Param('productId') productId: string,
        @Body() dto: SetQtyDto,
    ): Promise<CartContract> {
        return this.cartService.setQty(buyerId, productId, dto.qty);
    }

    /** Удаляет позицию из корзины. */
    @Delete('items/:productId')
    @ApiOkResponse({ type: CartDto, description: 'Обновлённая корзина' })
    removeItem(
        @CurrentUser('id') buyerId: string,
        @Param('productId') productId: string,
    ): Promise<CartContract> {
        return this.cartService.removeItem(buyerId, productId);
    }

    /** Очищает корзину. */
    @Delete()
    @ApiOkResponse({ type: CartDto, description: 'Пустая корзина' })
    clear(@CurrentUser('id') buyerId: string): Promise<CartContract> {
        return this.cartService.clear(buyerId);
    }
}
