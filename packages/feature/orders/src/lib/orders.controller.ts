import type { Page } from '@brickam/core-kit';
import { ApiPaginatedOk, Auth, CurrentUser } from '@brickam/server-kit';
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { CheckoutResult, OrderContract, VendorOrderContract } from '../@types';
import { CheckoutDto } from './dto/checkout.dto';
import { OrdersQueryDto } from './dto/orders-query.dto';
import { OrderDto, VendorOrderDto } from './dto/response.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { OrdersService } from './orders.service';

/** Маршруты заказов (Foundations §11/§15). buyerId — текущий пользователь. */
@ApiTags('orders')
@Controller('orders')
@Auth()
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    /** Оформляет заказ из корзины. */
    @Post('checkout')
    @ApiOkResponse({ type: OrderDto, description: 'Оформленный заказ' })
    checkout(
        @CurrentUser('id') buyerId: string,
        @Body() dto: CheckoutDto,
    ): Promise<CheckoutResult> {
        return this.ordersService.checkout(buyerId, dto);
    }

    /** Подтверждает оплату заказа. */
    @Post(':id/pay')
    @ApiOkResponse({ type: OrderDto, description: 'Оплаченный заказ' })
    pay(@CurrentUser('id') buyerId: string, @Param('id') id: string): Promise<OrderContract> {
        return this.ordersService.pay(id, buyerId);
    }

    /** Постраничный список заказов покупателя. */
    @Get()
    @ApiPaginatedOk(OrderDto)
    list(
        @CurrentUser('id') buyerId: string,
        @Query() query: OrdersQueryDto,
    ): Promise<Page<OrderContract>> {
        return this.ordersService.listOrders(buyerId, query);
    }

    /** Заказ покупателя по id. */
    @Get(':id')
    @ApiOkResponse({ type: OrderDto, description: 'Заказ покупателя' })
    getOrder(@CurrentUser('id') buyerId: string, @Param('id') id: string): Promise<OrderContract> {
        return this.ordersService.getOrder(id, buyerId);
    }

    /** Меняет статус доставки саб-заказа вендора. */
    @Patch('vendor-orders/:id/delivery')
    @ApiOkResponse({ type: VendorOrderDto, description: 'Обновлённый саб-заказ' })
    updateDelivery(
        @Param('id') id: string,
        @Body() dto: UpdateDeliveryDto,
    ): Promise<VendorOrderContract> {
        return this.ordersService.updateDelivery(id, dto.status, dto.note);
    }
}
