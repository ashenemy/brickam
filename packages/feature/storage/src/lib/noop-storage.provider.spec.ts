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
});
