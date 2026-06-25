/** Конверт ответа API (как у товаров/инвойсов). */
export type ApiResponse<T> = {
    success: boolean;
    data: T;
};

/** Тип генерации AI-ассистента продавца. */
export type AiJobType = 'description' | 'image' | 'video';

/** Статус фоновой задачи генерации. */
export type AiJobStatus = 'queued' | 'processing' | 'done' | 'failed';

/**
 * Фоновая задача AI-ассистента продавца.
 * `result` — строка: для description это текст, для image/video — URL медиа.
 * `progress` — 0..100. `productId` — товар, к которому относится генерация.
 */
export type AiJob = {
    id: string;
    type: AiJobType;
    status: AiJobStatus;
    progress: number;
    result?: string;
    error?: string;
    productId?: string;
};

/** Тело создания задачи генерации. */
export type CreateAiJobPayload = {
    type: AiJobType;
    userPrompt: string;
    productId?: string;
};
