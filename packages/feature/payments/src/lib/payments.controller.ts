import type { PaymentResult } from '@brickam/domain-kit';
import { Permission } from '@brickam/domain-kit';
import { Auth } from '@brickam/server-kit';
import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Public } from './public.decorator';

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
    @ApiOkResponse({ description: 'Платёж подтверждён (или уже был подтверждён)' })
    handleWebhook(
        @Body() payload: Record<string, unknown>,
        @Headers('x-signature') signature?: string,
    ): Promise<PaymentResult> {
        return this.paymentsService.handleWebhook(payload, signature);
    }

    /** Возврат средств по платежу. Доступ — управление заказами. */
    @Post(':id/refund')
    @Auth(Permission.OrdersView)
    @ApiOkResponse({ description: 'Платёж возвращён' })
    refund(@Param('id') id: string): Promise<PaymentResult> {
        return this.paymentsService.refund(id);
    }
}
