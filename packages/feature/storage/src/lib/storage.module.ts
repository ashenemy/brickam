import { AppConfigService } from '@brickam/config-kit';
import { Global, Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { createStorageProvider } from './storage.factory';
import { StorageProvider } from './storage.provider';

/**
 * Глобальный модуль хранилища медиа. Провайдит `StorageProvider`, выбирая
 * реализацию через фабрику (S3 при наличии `secrets.s3Bucket`, иначе Noop).
 * Контроллер выдаёт presigned-URL для прямой загрузки в S3.
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
    ],
    exports: [StorageProvider],
})
export class StorageModule {}
