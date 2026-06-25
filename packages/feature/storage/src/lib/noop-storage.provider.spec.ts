import { describe, expect, it } from 'vitest';
import { NoopStorageProvider } from './noop-storage.provider';

describe('NoopStorageProvider', () => {
    it('возвращает dev-заглушку с переданным ключом', async () => {
        const provider = new NoopStorageProvider();

        const result = await provider.getUploadUrl({
            key: 'products/v1/cover.jpg',
            contentType: 'image/jpeg',
        });

        expect(result).toEqual({
            uploadUrl: 'about:blank#dev-upload',
            publicUrl: '/uploads/products/v1/cover.jpg',
            key: 'products/v1/cover.jpg',
        });
    });

    it('putObject возвращает /uploads-заглушку с ключом', async () => {
        const provider = new NoopStorageProvider();

        const result = await provider.putObject(
            'videos/clip.mp4',
            new Uint8Array([0]),
            'video/mp4',
        );

        expect(result).toEqual({ url: '/uploads/videos/clip.mp4' });
    });
});
