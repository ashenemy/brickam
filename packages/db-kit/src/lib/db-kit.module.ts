import { AppConfigService } from '@brickam/config-kit';
import { type DynamicModule, Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

/**
 * Глобальное подключение к MongoDB. URI берётся из валидированного конфига
 * (config-kit), который, в свою очередь, читает MONGO_URI из env.
 */
@Global()
@Module({})
export class DbKitModule {
    static forRoot(): DynamicModule {
        return {
            module: DbKitModule,
            imports: [
                MongooseModule.forRootAsync({
                    inject: [AppConfigService],
                    useFactory: (config: AppConfigService) => ({
                        uri: config.database.mongoUri,
                    }),
                }),
            ],
            exports: [MongooseModule],
        };
    }
}
