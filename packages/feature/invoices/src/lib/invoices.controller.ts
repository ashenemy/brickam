import { ValidationException } from '@brickam/core-kit';
import { Permission } from '@brickam/domain-kit';
import type { VendorContext } from '@brickam/server-kit';
import { Auth, CurrentUser, CurrentVendor, Idempotent } from '@brickam/server-kit';
import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { InvoiceContract, InvoicePayResult } from '../@types';
import { CreateInvoiceDto, InvoiceDto } from './dto/invoice.dto';
import { InvoicesService } from './invoices.service';

/** Маршруты кастомных инвойсов (Foundations §15, Stage 9). */
@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
    constructor(private readonly invoicesService: InvoicesService) {}

    /** Создаёт инвойс (черновик) от имени текущего продавца. */
    @Post()
    @Auth(Permission.InvoicesCreate)
    @ApiOkResponse({ type: InvoiceDto, description: 'Созданный инвойс' })
    create(
        @CurrentVendor() vendor: VendorContext | undefined,
        @Body() dto: CreateInvoiceDto,
    ): Promise<InvoiceContract> {
        if (!vendor?.id) {
            throw new ValidationException('errors.invoices.noVendor');
        }
        return this.invoicesService.create(vendor.id, dto);
    }

    /** Отправляет инвойс покупателю в чат (draft→sent). */
    @Post(':id/send')
    @Auth(Permission.InvoicesCreate)
    @ApiOkResponse({ type: InvoiceDto, description: 'Отправленный инвойс' })
    send(
        @Param('id') id: string,
        @CurrentVendor() vendor: VendorContext | undefined,
    ): Promise<InvoiceContract> {
        if (!vendor?.id) {
            throw new ValidationException('errors.invoices.noVendor');
        }
        return this.invoicesService.send(id, vendor.id);
    }

    /** Оплачивает инвойс (создаёт заказ). Идемпотентно по Idempotency-Key. */
    @Post(':id/pay')
    @Auth()
    @Idempotent()
    @ApiOkResponse({ description: 'Оплаченный инвойс и созданный заказ' })
    pay(@Param('id') id: string, @CurrentUser('id') buyerId: string): Promise<InvoicePayResult> {
        return this.invoicesService.pay(id, buyerId);
    }

    /** Отменяет инвойс (draft|sent → cancelled). */
    @Post(':id/cancel')
    @Auth(Permission.InvoicesCreate)
    @ApiOkResponse({ type: InvoiceDto, description: 'Отменённый инвойс' })
    cancel(
        @Param('id') id: string,
        @CurrentVendor() vendor: VendorContext | undefined,
    ): Promise<InvoiceContract> {
        if (!vendor?.id) {
            throw new ValidationException('errors.invoices.noVendor');
        }
        return this.invoicesService.cancel(id, vendor.id);
    }

    /** Инвойс по id. */
    @Get(':id')
    @Auth()
    @ApiOkResponse({ type: InvoiceDto, description: 'Инвойс' })
    getById(@Param('id') id: string): Promise<InvoiceContract> {
        return this.invoicesService.getById(id);
    }

    /** Инвойсы диалога. */
    @Get('chat/:chatId')
    @Auth()
    @ApiOkResponse({ type: [InvoiceDto], description: 'Инвойсы диалога' })
    getByChat(@Param('chatId') chatId: string): Promise<InvoiceContract[]> {
        return this.invoicesService.getByChat(chatId);
    }

    /** Стримит PDF инвойса. */
    @Get(':id/pdf')
    @Auth()
    async pdf(@Param('id') id: string, @Res({ passthrough: false }) res: Response): Promise<void> {
        const buffer = await this.invoicesService.pdf(id);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="invoice-${id}.pdf"`);
        res.end(buffer);
    }
}
