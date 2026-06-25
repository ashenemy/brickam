import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { S3StorageConfig, UploadUrlInput, UploadUrlResult } from '../@types';
import { StorageProvider } from './storage.provider';

/** Время жизни presigned-URL в секундах (15 минут). */
const UPLOAD_URL_EXPIRES_IN = 900;

/**
 * Провайдер на базе AWS SDK v3 для S3-совместимых хранилищ (AWS S3, MinIO и др.).
 * Генерирует presigned PUT-URL; публичный URL собирается из `publicUrl` или
 * из `endpoint`/`bucket`.
 */
export class S3StorageProvider extends StorageProvider {
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly publicUrlBase: string;

    constructor(config: S3StorageConfig) {
        super();
        this.bucket = config.bucket;
        this.client = new S3Client({
            region: config.region ?? 'us-east-1',
            ...(config.endpoint ? { endpoint: config.endpoint } : {}),
            ...(config.accessKeyId && config.secretAccessKey
                ? {
                      credentials: {
                          accessKeyId: config.accessKeyId,
                          secretAccessKey: config.secretAccessKey,
                      },
                  }
                : {}),
            // Path-style обязателен для self-hosted endpoint (MinIO/совместимые).
            forcePathStyle: !!config.endpoint,
        });
        this.publicUrlBase = S3StorageProvider.resolvePublicUrlBase(config);
    }

    /** База публичного URL без завершающего слэша. */
    private static resolvePublicUrlBase(config: S3StorageConfig): string {
        const trim = (value: string): string => value.replace(/\/+$/, '');
        if (config.publicUrl) {
            return trim(config.publicUrl);
        }
        if (config.endpoint) {
            return `${trim(config.endpoint)}/${config.bucket}`;
        }
        const region = config.region ?? 'us-east-1';
        return `https://${config.bucket}.s3.${region}.amazonaws.com`;
    }

    override async getUploadUrl({ key, contentType }: UploadUrlInput): Promise<UploadUrlResult> {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
        });
        const uploadUrl = await getSignedUrl(this.client, command, {
            expiresIn: UPLOAD_URL_EXPIRES_IN,
        });
        return {
            uploadUrl,
            publicUrl: `${this.publicUrlBase}/${key}`,
            key,
        };
    }
}
