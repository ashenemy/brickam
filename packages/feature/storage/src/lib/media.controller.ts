import { ValidationException } from '@brickam/core-kit';
import { Permission } from '@brickam/domain-kit';
import { Auth, CurrentVendor, type VendorContext } from '@brickam/server-kit';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { UploadUrlResult } from '../@types';
import { UploadUrlRequestDto, UploadUrlResponseDto } from './dto/upload-url.dto';
import { StorageProvider } from './storage.provider';

/** Разрешённые префиксы MIME-типов медиа. */
const ALLOWED_PREFIXES = ['image/', 'video/'] as const;

/** Приводит имя файла к безопасному виду для пути в бакете. */
function sanitizeFilename(filename: string): string {
    const base = filename.split(/[\\/]/).pop() ?? filename;
    const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
    return cleaned || 'file';
}

/** Маршруты медиа: выдача presigned-URL для прямой загрузки в S3. */
@ApiTags('media')
@Controller('media')
export class MediaController {
    constructor(private readonly storage: StorageProvider) {}

    /**
     * Возвращает presigned PUT-URL: фронт грузит файл напрямую в S3.
     * Требует право управления товарами; тип файла — только image/* или video/*.
     */
    @Post('upload-url')
    @Auth(Permission.ProductsManage)
    @ApiOkResponse({ type: UploadUrlResponseDto, description: 'Presigned-URL загрузки' })
    getUploadUrl(
        @Body() dto: UploadUrlRequestDto,
        @CurrentVendor() vendor?: VendorContext,
    ): Promise<UploadUrlResult> {
        const supported = ALLOWED_PREFIXES.some((prefix) => dto.contentType.startsWith(prefix));
        if (!supported) {
            throw new ValidationException('errors.storage.unsupportedType');
        }
        const scope = vendor?.id ?? 'shared';
        const key = `products/${scope}/${sanitizeFilename(dto.filename)}`;
        return this.storage.getUploadUrl({ key, contentType: dto.contentType });
    }
}
