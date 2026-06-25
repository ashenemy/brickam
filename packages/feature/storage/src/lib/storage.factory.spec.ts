import type { AppConfigService } from '@brickam/config-kit';
import { describe, expect, it } from 'vitest';
import { NoopStorageProvider } from './noop-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';
import { createStorageProvider } from './storage.factory';

function configWith(secrets: Record<string, unknown>): AppConfigService {
    return { secrets } as unknown as AppConfigService;
}

describe('createStorageProvider', () => {
    it('с заданным s3Bucket → S3StorageProvider', () => {
        const provider = createStorageProvider(
            configWith({
                s3Bucket: 'my-bucket',
                s3Region: 'eu-central-1',
                s3AccessKeyId: 'AK',
                s3SecretAccessKey: 'SK',
            }),
        );

        expect(provider).toBeInstanceOf(S3StorageProvider);
    });

    it('без s3Bucket → NoopStorageProvider', () => {
        const provider = createStorageProvider(configWith({}));

        expect(provider).toBeInstanceOf(NoopStorageProvider);
    });
});
