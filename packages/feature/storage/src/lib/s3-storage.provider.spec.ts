import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { S3StorageProvider } from './s3-storage.provider';

vi.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: vi.fn(),
}));

const signedMock = getSignedUrl as unknown as Mock;

describe('S3StorageProvider', () => {
    beforeEach(() => {
        signedMock.mockReset();
        signedMock.mockResolvedValue('https://signed.example/put');
    });

    it('подписывает PutObjectCommand с корректными Bucket/Key/ContentType и собирает publicUrl', async () => {
        const provider = new S3StorageProvider({
            region: 'eu-central-1',
            bucket: 'my-bucket',
            accessKeyId: 'AK',
            secretAccessKey: 'SK',
            publicUrl: 'https://cdn.example.com',
        });

        const result = await provider.getUploadUrl({
            key: 'products/v1/cover.jpg',
            contentType: 'image/png',
        });

        expect(signedMock).toHaveBeenCalledTimes(1);
        const [client, command, options] = signedMock.mock.calls[0];
        expect(client).toBeDefined();
        expect(command).toBeInstanceOf(PutObjectCommand);
        expect(command.input).toMatchObject({
            Bucket: 'my-bucket',
            Key: 'products/v1/cover.jpg',
            ContentType: 'image/png',
        });
        expect(options).toEqual({ expiresIn: 900 });

        expect(result).toEqual({
            uploadUrl: 'https://signed.example/put',
            publicUrl: 'https://cdn.example.com/products/v1/cover.jpg',
            key: 'products/v1/cover.jpg',
        });
    });

    it('обрезает завершающий слэш в publicUrl', async () => {
        const provider = new S3StorageProvider({
            bucket: 'b',
            publicUrl: 'https://cdn.example.com/',
        });

        const result = await provider.getUploadUrl({ key: 'a/b.png', contentType: 'image/png' });

        expect(result.publicUrl).toBe('https://cdn.example.com/a/b.png');
    });

    it('собирает publicUrl из endpoint и bucket, когда publicUrl не задан', async () => {
        const provider = new S3StorageProvider({
            endpoint: 'http://localhost:9000',
            bucket: 'media',
        });

        const result = await provider.getUploadUrl({ key: 'x.png', contentType: 'image/png' });

        expect(result.publicUrl).toBe('http://localhost:9000/media/x.png');
    });

    it('собирает AWS-style publicUrl из bucket и region по умолчанию', async () => {
        const provider = new S3StorageProvider({ bucket: 'media' });

        const result = await provider.getUploadUrl({ key: 'x.png', contentType: 'image/png' });

        expect(result.publicUrl).toBe('https://media.s3.us-east-1.amazonaws.com/x.png');
    });

    it('putObject шлёт PutObjectCommand с Bucket/Key/Body/ContentType и возвращает publicUrl', async () => {
        const provider = new S3StorageProvider({
            bucket: 'my-bucket',
            publicUrl: 'https://cdn.example.com',
        });
        const send = vi.fn().mockResolvedValue({});
        // Подменяем приватный S3Client инжектированным моком.
        (provider as unknown as { client: { send: Mock } }).client = { send };

        const body = new Uint8Array([1, 2, 3]);
        const result = await provider.putObject('videos/abc.mp4', body, 'video/mp4');

        expect(send).toHaveBeenCalledTimes(1);
        const command = send.mock.calls[0][0] as PutObjectCommand;
        expect(command).toBeInstanceOf(PutObjectCommand);
        expect(command.input).toMatchObject({
            Bucket: 'my-bucket',
            Key: 'videos/abc.mp4',
            Body: body,
            ContentType: 'video/mp4',
        });
        expect(result).toEqual({ url: 'https://cdn.example.com/videos/abc.mp4' });
    });
});
