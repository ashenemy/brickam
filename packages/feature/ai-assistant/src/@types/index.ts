import type { AiJobStatus, AiJobType, LocalizedText } from '@brickam/domain-kit';

/**
 * Результат генерации описания (LLM): локализованный текст для всех локалей.
 */
export type AiDescriptionResult = {
    text: LocalizedText;
};

/**
 * Результат генерации медиа (image/video): URL результата и опц. превью.
 */
export type AiMediaResult = {
    url: string;
    thumbnailUrl?: string;
};

/** Полезный результат AI-задачи (зависит от типа). */
export type AiJobResult = AiDescriptionResult | AiMediaResult;

/** Полезная нагрузка job'а очереди ai-jobs (сборка промпта — в процессоре). */
export type AiJobQueueData = {
    jobId: string;
};

/** Публичный контракт AI-задачи (статус/прогресс/результат). */
export type AiJobContract = {
    id: string;
    vendorId: string;
    productId?: string;
    type: AiJobType;
    status: AiJobStatus;
    userPrompt: string;
    finalPrompt?: string;
    progress: number;
    result?: AiJobResult;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
};
