import type { UploadUrlInput, UploadUrlResult } from '../@types';

/**
 * Абстракция хранилища медиа. Реализации генерируют presigned-URL для прямой
 * загрузки файла фронтом в объектное хранилище, минуя бэкенд.
 */
export abstract class StorageProvider {
    /** Возвращает presigned-URL загрузки и публичный URL объекта. */
    abstract getUploadUrl(input: UploadUrlInput): Promise<UploadUrlResult>;
}
