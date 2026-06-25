import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import type { UploadUrlResult } from '../../@types';

/** Тело запроса на получение presigned-URL загрузки. */
export class UploadUrlRequestDto {
    @ApiProperty({ description: 'Имя файла', example: 'cover.jpg' })
    @IsString()
    @IsNotEmpty()
    filename!: string;

    @ApiProperty({ description: 'MIME-тип файла', example: 'image/jpeg' })
    @IsString()
    @IsNotEmpty()
    contentType!: string;
}

/** Ответ с presigned-URL загрузки. */
export class UploadUrlResponseDto implements UploadUrlResult {
    @ApiProperty({ description: 'Presigned PUT-URL для прямой загрузки в S3' })
    uploadUrl!: string;

    @ApiProperty({ description: 'Публичный URL объекта после загрузки' })
    publicUrl!: string;

    @ApiProperty({ description: 'Путь объекта в бакете' })
    key!: string;
}
