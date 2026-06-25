import { randomUUID } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import { ForbiddenException, NotFoundException, ValidationException } from '@brickam/core-kit';
import {
    type AiJobType,
    ImageProvider,
    LlmProvider,
    type LocalizedText,
    type MediaInput,
    PlatformSettingsContract,
    ProductMediaContract,
    StorageServiceContract,
    VideoProvider,
} from '@brickam/domain-kit';
import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { Queue } from 'bullmq';
import type { AiJobContract, AiJobQueueData, AiJobResult, AiMediaResult } from '../@types';
import { AI_GENERATE_JOB, AI_JOBS_QUEUE } from './ai-assistant.constants';
import type { AiJobDocument } from './ai-job.schema';
import { AiJobsRepository } from './ai-jobs.repository';
import { CreateAiJobDto } from './dto/ai-assistant.dto';
import { buildPrompt } from './prompt-builder.util';

/**
 * Сервис AI-ассистента продавца (Foundations §13, Stage 16). Промпт-управляемая
 * АСИНХРОННАЯ генерация (описание/картинка/видео) через ai_jobs c прогрессом:
 * queued → processing → done/failed. Создание ставит job в BullMQ-очередь;
 * сама генерация (`process`) выполняется процессором, поэтому тестируется без
 * Redis. Внешние провайдеры/контракты приходят глобально по DI (граница
 * feature — только kit/domain). Все операции SCOPED по вендору.
 */
@Injectable()
export class AiAssistantService {
    private readonly logger = new Logger(AiAssistantService.name);

    constructor(
        private readonly jobs: AiJobsRepository,
        private readonly platformSettings: PlatformSettingsContract,
        private readonly productMedia: ProductMediaContract,
        private readonly llm: LlmProvider,
        private readonly image: ImageProvider,
        private readonly video: VideoProvider,
        @InjectQueue(AI_JOBS_QUEUE) private readonly queue: Queue,
        @Optional()
        @Inject(StorageServiceContract)
        private readonly storage?: StorageServiceContract,
    ) {}

    /** Маппит документ AI-задачи в плоский контракт. */
    private toContract(doc: AiJobDocument): AiJobContract {
        const contract: AiJobContract = {
            id: doc.id ?? doc._id.toString(),
            vendorId: doc.vendorId,
            type: doc.type,
            status: doc.status,
            userPrompt: doc.userPrompt,
            progress: doc.progress,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
        if (doc.productId !== undefined) {
            contract.productId = doc.productId;
        }
        if (doc.finalPrompt !== undefined) {
            contract.finalPrompt = doc.finalPrompt;
        }
        if (doc.result !== undefined) {
            contract.result = doc.result;
        }
        if (doc.error !== undefined) {
            contract.error = doc.error;
        }
        return contract;
    }

    /**
     * Создаёт AI-задачу (status queued, progress 0) и ставит её в очередь
     * ai-jobs. Сборка finalPrompt и генерация выполняются в процессоре (async).
     */
    async createJob(vendorId: string, dto: CreateAiJobDto): Promise<AiJobContract> {
        const created = await this.jobs.create({
            vendorId,
            ...(dto.productId !== undefined ? { productId: dto.productId } : {}),
            type: dto.type,
            status: 'queued',
            userPrompt: dto.userPrompt,
            progress: 0,
        });

        const data: AiJobQueueData = { jobId: created.id ?? created._id.toString() };
        await this.queue.add(AI_GENERATE_JOB, data);

        return this.toContract(created);
    }

    /** Возвращает AI-задачу вендора (чужая → Forbidden). */
    async getJob(id: string, vendorId: string): Promise<AiJobContract> {
        const doc = await this.requireOwnedJob(id, vendorId);
        return this.toContract(doc);
    }

    /** Список AI-задач вендора (новые сверху). */
    async listJobs(vendorId: string): Promise<AiJobContract[]> {
        const docs = await this.jobs.findByVendor(vendorId);
        return docs.map((doc) => this.toContract(doc));
    }

    /**
     * Прикрепляет результат done-задачи (image/video) как обложку товара через
     * ProductMediaContract. Не-done, без productId или без url → ValidationException.
     */
    async attachResult(jobId: string, vendorId: string): Promise<void> {
        const job = await this.requireOwnedJob(jobId, vendorId);
        if (job.status !== 'done') {
            throw new ValidationException('errors.aiAssistant.notDone');
        }
        if (job.productId === undefined) {
            throw new ValidationException('errors.aiAssistant.noProduct');
        }
        const result = job.result;
        if (!result || !this.isMediaResult(result)) {
            throw new ValidationException('errors.aiAssistant.notAttachable');
        }

        const cover: MediaInput = {
            mediaType: job.type === 'video' ? 'video' : 'image',
            url: result.url,
            ...(result.thumbnailUrl !== undefined ? { thumbnailUrl: result.thumbnailUrl } : {}),
        };
        await this.productMedia.setCover(job.productId, vendorId, cover);
    }

    /**
     * Выполняет генерацию AI-задачи (зовётся процессором, без очереди).
     * Жизненный цикл: грузит job → processing (progress 25) → собирает
     * finalPrompt (шаблон + промпт + контекст) → по типу зовёт провайдера →
     * result + progress 100 + done. Любая ошибка провайдера → failed + error
     * (НЕ кидается наружу, чтобы воркер не падал).
     */
    async process(jobId: string): Promise<void> {
        const job = await this.jobs.findById(jobId);
        if (!job) {
            this.logger.warn(`ai-jobs: задача ${jobId} не найдена`);
            return;
        }

        try {
            await this.jobs.updateById(jobId, { status: 'processing', progress: 25 });

            const prompts = await this.platformSettings.getAiPrompts();
            const ctx = job.productId
                ? await this.productMedia.getProductContext(job.productId, job.vendorId)
                : null;
            const finalPrompt = buildPrompt(job.type, prompts, job.userPrompt, ctx);
            await this.jobs.updateById(jobId, { finalPrompt, progress: 50 });

            const result = await this.generate(job.type, finalPrompt, ctx?.gallery ?? []);

            await this.jobs.updateById(jobId, {
                status: 'done',
                progress: 100,
                result,
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.error(`ai-jobs: задача ${jobId} провалена: ${message}`);
            await this.jobs.updateById(jobId, { status: 'failed', error: message });
        }
    }

    /** Делегирует генерацию нужному провайдеру по типу задачи. */
    private async generate(
        type: AiJobType,
        finalPrompt: string,
        gallery: string[],
    ): Promise<AiJobResult> {
        switch (type) {
            case 'description': {
                const text = await this.llm.complete(finalPrompt);
                return { text: this.toLocalized(text) };
            }
            case 'image': {
                const { url } = await this.image.generate(finalPrompt);
                return { url };
            }
            case 'video': {
                const { url, thumbnailUrl } = await this.video.slideshow(gallery, finalPrompt);
                const publicUrl = await this.publishVideo(url);
                return { url: publicUrl, ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}) };
            }
        }
    }

    /**
     * Выгружает отрендеренный ffmpeg-mp4 в хранилище через контракт и возвращает
     * публичный URL (граница kit→feature: ai-kit отдаёт локальный путь, заливку
     * делает потребитель). Если хранилище не подключено (юнит/e2e без storage),
     * возвращает исходный `localPath` без изменений (@Optional-паттерн).
     */
    private async publishVideo(localPath: string): Promise<string> {
        if (!this.storage) {
            return localPath;
        }
        const bytes = await readFile(localPath);
        const key = `videos/${randomUUID()}.mp4`;
        const { url } = await this.storage.putObject(key, bytes, 'video/mp4');
        try {
            await unlink(localPath);
        } catch {
            // временный файл мог уже исчезнуть — не критично
        }
        return url;
    }

    /**
     * Оформляет сырой ответ LLM в LocalizedText. Если ответ — валидный JSON с
     * локалями (hy/ru/en) — берёт их; иначе один и тот же текст на все локали.
     */
    private toLocalized(raw: string): LocalizedText {
        try {
            const parsed = JSON.parse(raw) as Partial<LocalizedText>;
            if (
                typeof parsed.hy === 'string' &&
                typeof parsed.ru === 'string' &&
                typeof parsed.en === 'string'
            ) {
                return { hy: parsed.hy, ru: parsed.ru, en: parsed.en };
            }
        } catch {
            // не JSON — используем как единый текст
        }
        const text = raw.trim();
        return { hy: text, ru: text, en: text };
    }

    /** Грузит задачу и проверяет принадлежность вендору (чужая → Forbidden). */
    private async requireOwnedJob(id: string, vendorId: string): Promise<AiJobDocument> {
        const doc = await this.jobs.findById(id);
        if (!doc) {
            throw new NotFoundException('errors.aiAssistant.notFound');
        }
        if (doc.vendorId !== vendorId) {
            throw new ForbiddenException('errors.aiAssistant.notOwner');
        }
        return doc;
    }

    /** Тип-гард результата-медиа (есть url). */
    private isMediaResult(result: AiJobResult): result is AiMediaResult {
        return typeof (result as AiMediaResult).url === 'string';
    }
}
