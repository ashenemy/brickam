import { ValidationException } from '@brickam/core-kit';
import { Permission } from '@brickam/domain-kit';
import { Auth, CurrentVendor, type VendorContext } from '@brickam/server-kit';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { BulkApplyResult, BulkPreviewResult } from '../@types';
import { BulkService } from './bulk.service';
import { assertBulkOp, BulkRequestDto } from './dto/bulk.dto';

/**
 * Маршруты массовых операций над товарами вендора (Foundations §14, Stage 15).
 * vendorId берётся из контекста продавца (`@CurrentVendor`); все операции SCOPED.
 * Требует право `products.manage`.
 */
@ApiTags('vendor-bulk')
@Controller('vendor-bulk')
@Auth(Permission.ProductsManage)
export class BulkController {
    constructor(private readonly bulkService: BulkService) {}

    /** Предпросмотр массовой операции (до/после), без записи в БД. */
    @Post('preview')
    @ApiOkResponse({ description: 'Превью массовой операции (до/после)' })
    preview(
        @CurrentVendor() vendor: VendorContext | undefined,
        @Body() dto: BulkRequestDto,
    ): Promise<BulkPreviewResult> {
        const op = dto.op;
        assertBulkOp(op);
        return this.bulkService.preview(this.requireVendor(vendor), dto.productIds, op);
    }

    /** Применяет массовую операцию (синхронно для малых наборов, иначе в очередь). */
    @Post('apply')
    @ApiOkResponse({ description: 'Результат применения (sync|queued)' })
    apply(
        @CurrentVendor() vendor: VendorContext | undefined,
        @Body() dto: BulkRequestDto,
    ): Promise<BulkApplyResult> {
        const op = dto.op;
        assertBulkOp(op);
        return this.bulkService.apply(this.requireVendor(vendor), dto.productIds, op);
    }

    /** Гарантирует наличие контекста продавца (иначе нечего scoped-обновлять). */
    private requireVendor(vendor: VendorContext | undefined): string {
        if (!vendor) {
            throw new ValidationException('errors.bulk.noVendor');
        }
        return vendor.id;
    }
}
