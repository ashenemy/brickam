import type { UploadUrlInput, UploadUrlResult } from '../@types';
import { StorageProvider } from './storage.provider';

/**
 * Dev-заглушка хранилища: возвращает фиктивный upload-URL без обращения к S3.
 * Используется, когда S3-ключи не сконфигурированы, чтобы dev-окружение работало.
 */
export class NoopStorageProvider extends StorageProvider {
    override getUploadUrl({ key }: UploadUrlInput): Promise<UploadUrlResult> {
        return Promise.resolve({
            uploadUrl: 'about:blank#dev-upload',
            publicUrl: `/uploads/${key}`,
            key,
        });
    }
}
