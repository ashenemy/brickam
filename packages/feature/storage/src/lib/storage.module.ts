import { AppConfigService } from '@brickam/config-kit';
import { StorageServiceContract } from '@brickam/domain-kit';
import { Global, Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { createStorageProvider } from './storage.factory';
import { StorageProvider } from './storage.provider';

/**
 * Глобальный модуль хранилища медиа. Провайдит `StorageProvider`, выбирая
 * реализацию через фабрику (S3 при наличии `secrets.s3Bucket`, иначе Noop).
 * Контроллер выдаёт presigned-URL для прямой загрузки в S3. Дополнительно
 * биндит `StorageServiceContract` на ту же реализацию, чтобы потребители вне
 * feature/storage (напр. ai-assistant) зависели только от контракта.
 */
@Global()
@Module({
    controllers: [MediaController],
    providers: [
        {
            provide: StorageProvider,
            useFactory: createStorageProvider,
            inject: [AppConfigService],
        },
        { provide: StorageServiceContract, useExisting: StorageProvider },
    ],
    exports: [StorageProvider, StorageServiceContract],
})
export class StorageModule {}
