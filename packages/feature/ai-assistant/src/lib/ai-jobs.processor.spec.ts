import type { Job } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AiJobQueueData } from '../@types';
import type { AiAssistantService } from './ai-assistant.service';
import { AiJobsProcessor } from './ai-jobs.processor';

describe('AiJobsProcessor', () => {
    let service: { process: ReturnType<typeof vi.fn> };
    let processor: AiJobsProcessor;

    beforeEach(() => {
        service = { process: vi.fn().mockResolvedValue(undefined) };
        processor = new AiJobsProcessor(service as unknown as AiAssistantService);
    });

    it('делегирует service.process(jobId) из job.data', async () => {
        const job = { id: 'q-1', data: { jobId: 'job-1' } } as Job<AiJobQueueData>;
        await processor.process(job);
        expect(service.process).toHaveBeenCalledWith('job-1');
    });
});
