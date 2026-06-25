import { AppConfigService } from '@brickam/config-kit';
import { type DynamicModule, Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoTransactionRunner, TransactionRunner } from './transaction.runner';

/**
 * Глобальное подключение к MongoDB. URI берётся из валидированного конфига
 * (config-kit), который, в свою очередь, читает MONGO_URI из env.
 * Также провайдит TransactionRunner (единица работы поверх сессии).
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
                        // В проде индексы НЕ строятся автоматически на старте (долго и
                        // блокирующе) — их создаёт миграция `npm run migrate`. В dev/test
                        // autoIndex включён для удобства.
                        autoIndex: !config.isProduction,
                    }),
                }),
            ],
            providers: [{ provide: TransactionRunner, useClass: MongoTransactionRunner }],
            exports: [MongooseModule, TransactionRunner],
        };
    }
}
