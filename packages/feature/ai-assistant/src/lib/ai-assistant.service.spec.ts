import { AppException } from '@brickam/core-kit';
import type {
    AiPrompts,
    ImageProvider,
    LlmProvider,
    PlatformSettingsContract,
    ProductAiContext,
    ProductMediaContract,
    StorageServiceContract,
    VideoProvider,
} from '@brickam/domain-kit';
import type { Queue } from 'bullmq';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { readFileMock, unlinkMock } = vi.hoisted(() => ({
    readFileMock: vi.fn(),
    unlinkMock: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
    readFile: readFileMock,
    unlink: unlinkMock,
}));

import { AiAssistantService } from './ai-assistant.service';
import type { AiJobDocument } from './ai-job.schema';
import type { AiJobsRepository } from './ai-jobs.repository';
import type { CreateAiJobDto } from './dto/ai-assistant.dto';

const prompts: AiPrompts = {
    description: 'TPL-desc',
    image: 'TPL-img',
    video: 'TPL-video',
};

const ctx: ProductAiContext = {
    title: { hy: '', ru: 'Цемент', en: 'Cement' },
    description: { hy: '', ru: 'Описание', en: '' },
    categoryId: 'c1',
    gallery: ['https://img/1.jpg', 'https://img/2.jpg'],
};

const makeDoc = (over: Partial<AiJobDocument> = {}): AiJobDocument =>
    ({
        id: 'job-1',
        _id: { toString: () => 'job-1' },
        vendorId: 'v1',
        type: 'description',
        status: 'queued',
        userPrompt: 'промпт',
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...over,
    }) as unknown as AiJobDocument;

describe('AiAssistantService', () => {
    let jobs: {
        create: ReturnType<typeof vi.fn>;
        findById: ReturnType<typeof vi.fn>;
        findByVendor: ReturnType<typeof vi.fn>;
        updateById: ReturnType<typeof vi.fn>;
    };
    let platformSettings: { getAiPrompts: ReturnType<typeof vi.fn> };
    let productMedia: {
        getProductContext: ReturnType<typeof vi.fn>;
        setCover: ReturnType<typeof vi.fn>;
    };
    let llm: { complete: ReturnType<typeof vi.fn> };
    let image: { generate: ReturnType<typeof vi.fn> };
    let video: { slideshow: ReturnType<typeof vi.fn> };
    let queue: { add: ReturnType<typeof vi.fn> };
    let service: AiAssistantService;

    /** Возвращает «состояние» job-документа, обновляемое updateById (для process). */
    function trackJob(initial: AiJobDocument): AiJobDocument {
        const doc = { ...initial } as AiJobDocument;
        jobs.findById.mockResolvedValue(doc);
        jobs.updateById.mockImplementation(async (_id: string, patch: Partial<AiJobDocument>) => {
            Object.assign(doc, patch);
            return doc;
        });
        return doc;
    }

    beforeEach(() => {
        jobs = {
            create: vi.fn(),
            findById: vi.fn(),
            findByVendor: vi.fn(),
            updateById: vi.fn().mockResolvedValue(null),
        };
        platformSettings = { getAiPrompts: vi.fn().mockResolvedValue(prompts) };
        productMedia = {
            getProductContext: vi.fn().mockResolvedValue(ctx),
            setCover: vi.fn().mockResolvedValue(undefined),
        };
        llm = { complete: vi.fn().mockResolvedValue('Готовое описание') };
        image = { generate: vi.fn().mockResolvedValue({ url: 'https://img/out.jpg' }) };
        video = {
            slideshow: vi.fn().mockResolvedValue({
                url: 'https://vid/out.mp4',
                thumbnailUrl: 'https://vid/t.jpg',
            }),
        };
        queue = { add: vi.fn().mockResolvedValue({ id: 'q-1' }) };
        readFileMock.mockReset();
        unlinkMock.mockReset().mockResolvedValue(undefined);

        service = new AiAssistantService(
            jobs as unknown as AiJobsRepository,
            platformSettings as unknown as PlatformSettingsContract,
            productMedia as unknown as ProductMediaContract,
            llm as unknown as LlmProvider,
            image as unknown as ImageProvider,
            video as unknown as VideoProvider,
            queue as unknown as Queue,
        );
    });

    describe('createJob', () => {
        it('создаёт job queued (progress 0) и ставит в очередь generate', async () => {
            jobs.create.mockResolvedValue(makeDoc());
            const dto: CreateAiJobDto = { type: 'description', userPrompt: 'промпт' };

            const result = await service.createJob('v1', dto);

            expect(jobs.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    vendorId: 'v1',
                    type: 'description',
                    status: 'queued',
                    userPrompt: 'промпт',
                    progress: 0,
                }),
            );
            expect(queue.add).toHaveBeenCalledWith('generate', { jobId: 'job-1' });
            expect(result.status).toBe('queued');
        });

        it('пробрасывает productId в job', async () => {
            jobs.create.mockResolvedValue(makeDoc({ productId: 'p1' }));
            await service.createJob('v1', {
                type: 'image',
                userPrompt: 'p',
                productId: 'p1',
            });
            expect(jobs.create).toHaveBeenCalledWith(expect.objectContaining({ productId: 'p1' }));
        });
    });

    describe('process — жизненный цикл', () => {
        it('description: queued → processing → done с result {text}, прогресс растёт', async () => {
            const doc = trackJob(makeDoc({ type: 'description', productId: 'p1' }));

            await service.process('job-1');

            // processing зафиксирован раньше done
            const statuses = jobs.updateById.mock.calls.map((c) => c[1].status).filter(Boolean);
            expect(statuses[0]).toBe('processing');
            const progresses = jobs.updateById.mock.calls
                .map((c) => c[1].progress)
                .filter((p) => p !== undefined);
            expect(progresses).toEqual([25, 50, 100]);
            expect(doc.status).toBe('done');
            expect(doc.progress).toBe(100);
            expect(doc.finalPrompt).toContain('TPL-desc');
            expect(doc.result).toEqual({
                text: { hy: 'Готовое описание', ru: 'Готовое описание', en: 'Готовое описание' },
            });
            expect(llm.complete).toHaveBeenCalledWith(doc.finalPrompt);
        });

        it('description: JSON-ответ LLM с локалями → распарсивается', async () => {
            llm.complete.mockResolvedValue(JSON.stringify({ hy: 'A', ru: 'Б', en: 'C' }));
            const doc = trackJob(makeDoc({ type: 'description' }));
            await service.process('job-1');
            expect(doc.result).toEqual({ text: { hy: 'A', ru: 'Б', en: 'C' } });
        });

        it('image: result {url}', async () => {
            const doc = trackJob(makeDoc({ type: 'image', productId: 'p1' }));
            await service.process('job-1');
            expect(doc.status).toBe('done');
            expect(doc.result).toEqual({ url: 'https://img/out.jpg' });
        });

        it('video: result {url, thumbnailUrl} из gallery контекста', async () => {
            const doc = trackJob(makeDoc({ type: 'video', productId: 'p1' }));
            await service.process('job-1');
            expect(video.slideshow).toHaveBeenCalledWith(ctx.gallery, doc.finalPrompt);
            expect(doc.result).toEqual({
                url: 'https://vid/out.mp4',
                thumbnailUrl: 'https://vid/t.jpg',
            });
        });

        it('video: при наличии storage локальный mp4 заливается, url → publicUrl', async () => {
            // slideshow отдаёт локальный путь файла, который нужно выгрузить.
            video.slideshow.mockResolvedValue({
                url: '/tmp/bh-slideshow-x/slideshow.mp4',
                thumbnailUrl: 'https://vid/t.jpg',
            });
            const bytes = new Uint8Array([10, 20, 30]);
            readFileMock.mockResolvedValue(bytes);
            const putObject = vi
                .fn()
                .mockResolvedValue({ url: 'https://cdn.example.com/videos/uid.mp4' });
            const storage = { putObject } as unknown as StorageServiceContract;

            const withStorage = new AiAssistantService(
                jobs as unknown as AiJobsRepository,
                platformSettings as unknown as PlatformSettingsContract,
                productMedia as unknown as ProductMediaContract,
                llm as unknown as LlmProvider,
                image as unknown as ImageProvider,
                video as unknown as VideoProvider,
                queue as unknown as Queue,
                storage,
            );

            const doc = trackJob(makeDoc({ type: 'video', productId: 'p1' }));
            await withStorage.process('job-1');

            expect(readFileMock).toHaveBeenCalledWith('/tmp/bh-slideshow-x/slideshow.mp4');
            expect(putObject).toHaveBeenCalledTimes(1);
            const [key, body, contentType] = putObject.mock.calls[0];
            expect(key).toMatch(/^videos\/.+\.mp4$/);
            expect(body).toBe(bytes);
            expect(contentType).toBe('video/mp4');
            expect(unlinkMock).toHaveBeenCalledWith('/tmp/bh-slideshow-x/slideshow.mp4');
            expect(doc.result).toEqual({
                url: 'https://cdn.example.com/videos/uid.mp4',
                thumbnailUrl: 'https://vid/t.jpg',
            });
        });

        it('без productId не зовёт getProductContext (контекст null)', async () => {
            trackJob(makeDoc({ type: 'description', productId: undefined }));
            await service.process('job-1');
            expect(productMedia.getProductContext).not.toHaveBeenCalled();
        });

        it('ошибка провайдера → failed + error, НЕ кидает наружу', async () => {
            image.generate.mockRejectedValue(new Error('provider down'));
            const doc = trackJob(makeDoc({ type: 'image', productId: 'p1' }));

            await expect(service.process('job-1')).resolves.toBeUndefined();

            expect(doc.status).toBe('failed');
            expect(doc.error).toBe('provider down');
        });

        it('job не найдена → тихо выходит', async () => {
            jobs.findById.mockResolvedValue(null);
            await expect(service.process('nope')).resolves.toBeUndefined();
            expect(jobs.updateById).not.toHaveBeenCalled();
        });
    });

    describe('attachResult', () => {
        it('done image → setCover(mediaType image, url)', async () => {
            jobs.findById.mockResolvedValue(
                makeDoc({
                    type: 'image',
                    status: 'done',
                    productId: 'p1',
                    result: { url: 'https://img/out.jpg' },
                }),
            );
            await service.attachResult('job-1', 'v1');
            expect(productMedia.setCover).toHaveBeenCalledWith('p1', 'v1', {
                mediaType: 'image',
                url: 'https://img/out.jpg',
            });
        });

        it('done video → setCover(mediaType video, url+thumbnailUrl)', async () => {
            jobs.findById.mockResolvedValue(
                makeDoc({
                    type: 'video',
                    status: 'done',
                    productId: 'p1',
                    result: { url: 'https://vid/out.mp4', thumbnailUrl: 'https://vid/t.jpg' },
                }),
            );
            await service.attachResult('job-1', 'v1');
            expect(productMedia.setCover).toHaveBeenCalledWith('p1', 'v1', {
                mediaType: 'video',
                url: 'https://vid/out.mp4',
                thumbnailUrl: 'https://vid/t.jpg',
            });
        });

        it('не-done → ValidationException, setCover не вызван', async () => {
            jobs.findById.mockResolvedValue(makeDoc({ type: 'image', status: 'processing' }));
            await expect(service.attachResult('job-1', 'v1')).rejects.toBeInstanceOf(AppException);
            expect(productMedia.setCover).not.toHaveBeenCalled();
        });

        it('done без url (description) → ValidationException', async () => {
            jobs.findById.mockResolvedValue(
                makeDoc({
                    type: 'description',
                    status: 'done',
                    productId: 'p1',
                    result: { text: { hy: 'a', ru: 'a', en: 'a' } },
                }),
            );
            await expect(service.attachResult('job-1', 'v1')).rejects.toBeInstanceOf(AppException);
            expect(productMedia.setCover).not.toHaveBeenCalled();
        });

        it('чужой вендор → Forbidden', async () => {
            jobs.findById.mockResolvedValue(
                makeDoc({ vendorId: 'other', status: 'done', productId: 'p1' }),
            );
            await expect(service.attachResult('job-1', 'v1')).rejects.toBeInstanceOf(AppException);
        });
    });

    describe('getJob / listJobs — scoped по vendorId', () => {
        it('getJob своей задачи возвращает контракт', async () => {
            jobs.findById.mockResolvedValue(makeDoc());
            const result = await service.getJob('job-1', 'v1');
            expect(result.id).toBe('job-1');
        });

        it('getJob чужой задачи → Forbidden', async () => {
            jobs.findById.mockResolvedValue(makeDoc({ vendorId: 'other' }));
            await expect(service.getJob('job-1', 'v1')).rejects.toBeInstanceOf(AppException);
        });

        it('getJob отсутствующей → NotFound', async () => {
            jobs.findById.mockResolvedValue(null);
            await expect(service.getJob('job-1', 'v1')).rejects.toBeInstanceOf(AppException);
        });

        it('listJobs отдаёт задачи вендора', async () => {
            jobs.findByVendor.mockResolvedValue([makeDoc(), makeDoc({ id: 'job-2' })]);
            const result = await service.listJobs('v1');
            expect(jobs.findByVendor).toHaveBeenCalledWith('v1');
            expect(result).toHaveLength(2);
        });
    });
});
