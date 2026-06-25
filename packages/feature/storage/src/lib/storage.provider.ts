import type { UploadUrlInput, UploadUrlResult } from '../@types';

/**
 * Абстракция хранилища медиа. Реализации генерируют presigned-URL для прямой
 * загрузки файла фронтом в объектное хранилище, минуя бэкенд.
 */
export abstract class StorageProvider {
    /** Возвращает presigned-URL загрузки и публичный URL объекта. */
    abstract getUploadUrl(input: UploadUrlInput): Promise<UploadUrlResult>;

    /**
     * Кладёт объект в хранилище под ключом `key` (серверная загрузка, минуя
     * presigned-URL) и возвращает его публичный URL. Используется потребителями
     * вроде ai-assistant для выгрузки отрендеренного видео.
     */
    abstract putObject(
        key: string,
        body: Uint8Array,
        contentType: string,
    ): Promise<{ url: string }>;
}
