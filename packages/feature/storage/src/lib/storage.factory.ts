import type { AppConfigService } from '@brickam/config-kit';
import { NoopStorageProvider } from './noop-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
import type { StorageProvider } from './storage.provider';

/**
 * Выбирает реализацию хранилища по конфигу: если задан `secrets.s3Bucket` —
 * реальный S3-провайдер, иначе dev-заглушка (Noop). Чистая функция для тестов
 * и для useFactory модуля.
 */
export function createStorageProvider(config: AppConfigService): StorageProvider {
    const secrets = config.secrets;
    if (secrets.s3Bucket) {
        return new S3StorageProvider({
            region: secrets.s3Region,
            endpoint: secrets.s3Endpoint,
            bucket: secrets.s3Bucket,
            accessKeyId: secrets.s3AccessKeyId,
            secretAccessKey: secrets.s3SecretAccessKey,
            publicUrl: secrets.s3PublicUrl,
        });
    }
    return new NoopStorageProvider();
}
