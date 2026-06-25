import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import type { AiJobQueueData } from '../@types';
import { AI_JOBS_QUEUE } from './ai-assistant.constants';
import { AiAssistantService } from './ai-assistant.service';

/**
 * Фоновый обработчик очереди ai-jobs (Foundations §13, Stage 16). Делегирует
 * генерацию сервису (`process(jobId)`), который сам ведёт статус/прогресс и
 * ловит ошибки провайдеров. Тестируется прямым вызовом `service.process`.
 */
@Processor(AI_JOBS_QUEUE)
export class AiJobsProcessor extends WorkerHost {
    private readonly logger = new Logger(AiJobsProcessor.name);

    constructor(private readonly service: AiAssistantService) {
        super();
    }

    /** Обрабатывает job `{jobId}` → генерация задачи. */
    async process(job: Job<AiJobQueueData>): Promise<void> {
        this.logger.log(`ai-jobs: обработка задачи ${job.data.jobId}`);
        await this.service.process(job.data.jobId);
    }
}
