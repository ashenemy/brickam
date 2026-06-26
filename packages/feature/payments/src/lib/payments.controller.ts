import type { PaymentResult } from '@brickam/domain-kit';
import { Permission } from '@brickam/domain-kit';
import { Auth } from '@brickam/server-kit';
import { Body, Controller, Get, Headers, Param, Post, Query, Res } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';
import { Public } from './public.decorator';

/** Базовый URL фронта для редиректа покупателя назад на /orders/:id. */
const siteUrl = (): string => process.env['SITE_URL'] ?? 'http://localhost:3000';

/**
 * Маршруты платежей (Foundations §11). Вебхук подтверждения оплаты — публичный
 * (@Public): реальный PSP шлёт его сервер-к-серверу без JWT, верификация — по
 * подписи в заголовке `x-signature` (проверяется внутри провайдера).
 */
@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    /**
     * Асинхронный вебхук провайдера: подтверждает оплату. Тело — сырой payload
     * провайдера, подпись — в заголовке `x-signature`. Идемпотентно.
     */
    @Post('webhook')
    @Public()
    // Лимит на публичный вебхук — защита от флуда (PSP шлёт единичные события).
    @Throttle({ default: { ttl: 60_000, limit: 60 } })
    @ApiOkResponse({ description: 'Платёж подтверждён (или уже был подтверждён)' })
    async handleWebhook(
        @Body() payload: Record<string, unknown>,
        @Headers('x-signature') signature?: string,
    ): Promise<PaymentResult | { precheck: true }> {
        return this.paymentsService.handleWebhook(payload, signature);
    }

    /**
     * Возврат покупателя с платёжной страницы ArCa (?orderId=…). Тянем статус,
     * подтверждаем оплату идемпотентно и редиректим на /orders/:id фронта.
     */
    @Get('arca/callback')
    @Public()
    @Throttle({ default: { ttl: 60_000, limit: 60 } })
    async arcaCallback(@Query('orderId') arcaOrderId: string, @Res() res: Response): Promise<void> {
        const { orderId } = await this.paymentsService.handleArcaReturn(arcaOrderId);
        res.redirect(302, `${siteUrl()}/orders/${orderId}`);
    }

    /**
     * Push-callback Idram (form-urlencoded). Прехек → отвечаем литералом `OK`
     * (Idram ждёт именно его). Валидный результат → confirm и `OK`; иначе 400.
     * Ответ — text/plain без JSON-конверта (Idram парсит тело как текст).
     */
    @Post('idram/callback')
    @Public()
    @Throttle({ default: { ttl: 60_000, limit: 60 } })
    async idramCallback(
        @Body() payload: Record<string, unknown>,
        @Res() res: Response,
    ): Promise<void> {
        try {
            const result = await this.paymentsService.handleWebhook(payload);
            res.type('text/plain').send('OK');
            void result;
        } catch {
            res.status(400).type('text/plain').send('ERROR');
        }
    }

    /** Возврат средств по платежу. Доступ — управление заказами. */
    @Post(':id/refund')
    @Auth(Permission.OrdersView)
    @Throttle({ default: { ttl: 60_000, limit: 10 } })
    @ApiOkResponse({ description: 'Платёж возвращён' })
    refund(@Param('id') id: string): Promise<PaymentResult> {
        return this.paymentsService.refund(id);
    }
}
