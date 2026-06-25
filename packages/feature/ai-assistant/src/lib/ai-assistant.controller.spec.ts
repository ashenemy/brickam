import { AppException } from '@brickam/core-kit';
import type { VendorContext } from '@brickam/server-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AiAssistantController } from './ai-assistant.controller';
import type { AiAssistantService } from './ai-assistant.service';
import type { CreateAiJobDto } from './dto/ai-assistant.dto';

describe('AiAssistantController', () => {
    let service: {
        createJob: ReturnType<typeof vi.fn>;
        listJobs: ReturnType<typeof vi.fn>;
        getJob: ReturnType<typeof vi.fn>;
        attachResult: ReturnType<typeof vi.fn>;
    };
    let controller: AiAssistantController;
    const vendor: VendorContext = { id: 'v1' };

    beforeEach(() => {
        service = {
            createJob: vi.fn().mockResolvedValue({ id: 'job-1' }),
            listJobs: vi.fn().mockResolvedValue([]),
            getJob: vi.fn().mockResolvedValue({ id: 'job-1' }),
            attachResult: vi.fn().mockResolvedValue(undefined),
        };
        controller = new AiAssistantController(service as unknown as AiAssistantService);
    });

    it('create передаёт vendorId и dto', async () => {
        const dto: CreateAiJobDto = { type: 'image', userPrompt: 'p' };
        await controller.create(vendor, dto);
        expect(service.createJob).toHaveBeenCalledWith('v1', dto);
    });

    it('list делегирует listJobs(vendorId)', async () => {
        await controller.list(vendor);
        expect(service.listJobs).toHaveBeenCalledWith('v1');
    });

    it('get делегирует getJob(id, vendorId)', async () => {
        await controller.get(vendor, 'job-1');
        expect(service.getJob).toHaveBeenCalledWith('job-1', 'v1');
    });

    it('attach делегирует attachResult(id, vendorId)', async () => {
        await controller.attach(vendor, 'job-1');
        expect(service.attachResult).toHaveBeenCalledWith('job-1', 'v1');
    });

    it('без контекста продавца → ValidationException', () => {
        const dto: CreateAiJobDto = { type: 'image', userPrompt: 'p' };
        expect(() => controller.create(undefined, dto)).toThrow(AppException);
    });
});
