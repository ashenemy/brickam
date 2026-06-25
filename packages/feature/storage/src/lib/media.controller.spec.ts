import { ValidationException } from '@brickam/core-kit';
import type { VendorContext } from '@brickam/server-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UploadUrlRequestDto } from './dto/upload-url.dto';
import { MediaController } from './media.controller';
import type { StorageProvider } from './storage.provider';

describe('MediaController', () => {
    let storage: { getUploadUrl: ReturnType<typeof vi.fn> };
    let controller: MediaController;

    beforeEach(() => {
        storage = {
            getUploadUrl: vi.fn().mockResolvedValue({
                uploadUrl: 'u',
                publicUrl: 'p',
                key: 'k',
            }),
        };
        controller = new MediaController(storage as unknown as StorageProvider);
    });

    it('валидный image/* → зовёт provider.getUploadUrl с key из vendor + filename', async () => {
        const dto: UploadUrlRequestDto = { filename: 'cover.jpg', contentType: 'image/jpeg' };
        const vendor: VendorContext = { id: 'v1' };

        await controller.getUploadUrl(dto, vendor);

        expect(storage.getUploadUrl).toHaveBeenCalledWith({
            key: 'products/v1/cover.jpg',
            contentType: 'image/jpeg',
        });
    });

    it('без vendor → scope = shared', async () => {
        const dto: UploadUrlRequestDto = { filename: 'clip.mp4', contentType: 'video/mp4' };

        await controller.getUploadUrl(dto, undefined);

        expect(storage.getUploadUrl).toHaveBeenCalledWith({
            key: 'products/shared/clip.mp4',
            contentType: 'video/mp4',
        });
    });

    it('санитизирует имя файла (путь и небезопасные символы)', async () => {
        const dto: UploadUrlRequestDto = {
            filename: '../../my file (1).PNG',
            contentType: 'image/png',
        };

        await controller.getUploadUrl(dto, { id: 'v1' });

        expect(storage.getUploadUrl).toHaveBeenCalledWith({
            key: 'products/v1/my-file-1-.PNG',
            contentType: 'image/png',
        });
    });

    it('неподдерживаемый тип → ValidationException, provider не вызывается', async () => {
        const dto: UploadUrlRequestDto = {
            filename: 'doc.pdf',
            contentType: 'application/pdf',
        };

        expect(() => controller.getUploadUrl(dto, { id: 'v1' })).toThrow(ValidationException);
        expect(storage.getUploadUrl).not.toHaveBeenCalled();
    });
});
