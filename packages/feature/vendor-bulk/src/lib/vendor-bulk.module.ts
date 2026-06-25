import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { BulkController } from './bulk.controller';
import { BulkProcessor } from './bulk.processor';
import { BulkService } from './bulk.service';
import { BULK_QUEUE } from './vendor-bulk.constants';

/**
 * Модуль массовых операций над товарами (Foundations §14, Stage 15). Регистрирует
 * BullMQ-очередь vendor-bulk; `BullModule.forRoot` с connection из
 * `config.queue.redisUrl` подключает интегратор сервера (граница feature —
 * только registerQueue здесь). Зависит лишь от kit/domain: товары приходят
 * через CatalogBulkContract (глобально из catalog).
 */
@Module({
    imports: [BullModule.registerQueue({ name: BULK_QUEUE })],
    controllers: [BulkController],
    providers: [BulkService, BulkProcessor],
    exports: [BulkService],
})
export class VendorBulkModule {}
