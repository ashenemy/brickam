import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AI_JOBS_QUEUE } from './ai-assistant.constants';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';
import { AiJob, AiJobSchema } from './ai-job.schema';
import { AiJobsProcessor } from './ai-jobs.processor';
import { AiJobsRepository } from './ai-jobs.repository';

/**
 * Модуль AI-ассистента продавца (Foundations §13, Stage 16). Регистрирует
 * BullMQ-очередь ai-jobs; `BullModule.forRoot` с connection из
 * `config.queue.redisUrl` подключает интегратор сервера (граница feature —
 * только registerQueue здесь). Зависит лишь от kit/domain: провайдеры
 * (LLM/Image/Video) и контракты platform/productMedia приходят глобально по DI.
 */
@Module({
    imports: [
        MongooseModule.forFeature([{ name: AiJob.name, schema: AiJobSchema }]),
        BullModule.registerQueue({ name: AI_JOBS_QUEUE }),
    ],
    controllers: [AiAssistantController],
    providers: [AiJobsRepository, AiAssistantService, AiJobsProcessor],
    exports: [AiAssistantService],
})
export class AiAssistantModule {}
