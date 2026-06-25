import { ValidationException } from '@brickam/core-kit';
import { Permission } from '@brickam/domain-kit';
import { Auth, CurrentVendor, type VendorContext } from '@brickam/server-kit';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { AiJobContract } from '../@types';
import { AiAssistantService } from './ai-assistant.service';
import { AiJobDto, CreateAiJobDto } from './dto/ai-assistant.dto';

/**
 * Маршруты AI-ассистента продавца (Foundations §13, Stage 16). vendorId берётся
 * из контекста продавца (`@CurrentVendor`); все операции SCOPED. Требует право
 * `products.manage`. Генерация асинхронна — клиент опрашивает статус/прогресс.
 */
@ApiTags('ai-assistant')
@Controller('ai-assistant')
@Auth(Permission.ProductsManage)
export class AiAssistantController {
    constructor(private readonly aiAssistantService: AiAssistantService) {}

    /** Создаёт AI-задачу и ставит её в очередь (status queued). */
    @Post('jobs')
    @ApiOkResponse({ type: AiJobDto, description: 'Созданная AI-задача (queued)' })
    create(
        @CurrentVendor() vendor: VendorContext | undefined,
        @Body() dto: CreateAiJobDto,
    ): Promise<AiJobContract> {
        return this.aiAssistantService.createJob(this.requireVendor(vendor), dto);
    }

    /** Список AI-задач текущего вендора. */
    @Get('jobs')
    @ApiOkResponse({ type: [AiJobDto], description: 'AI-задачи вендора' })
    list(@CurrentVendor() vendor: VendorContext | undefined): Promise<AiJobContract[]> {
        return this.aiAssistantService.listJobs(this.requireVendor(vendor));
    }

    /** Статус/прогресс/результат конкретной AI-задачи (только своя). */
    @Get('jobs/:id')
    @ApiOkResponse({ type: AiJobDto, description: 'Статус и прогресс AI-задачи' })
    get(
        @CurrentVendor() vendor: VendorContext | undefined,
        @Param('id') id: string,
    ): Promise<AiJobContract> {
        return this.aiAssistantService.getJob(id, this.requireVendor(vendor));
    }

    /** Прикрепляет результат done-задачи (image/video) как обложку товара. */
    @Post('jobs/:id/attach')
    @ApiOkResponse({ description: 'Результат прикреплён как обложка товара' })
    attach(
        @CurrentVendor() vendor: VendorContext | undefined,
        @Param('id') id: string,
    ): Promise<void> {
        return this.aiAssistantService.attachResult(id, this.requireVendor(vendor));
    }

    /** Гарантирует наличие контекста продавца (иначе нечего scoped-генерировать). */
    private requireVendor(vendor: VendorContext | undefined): string {
        if (!vendor) {
            throw new ValidationException('errors.aiAssistant.noVendor');
        }
        return vendor.id;
    }
}
