import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { ClientSession, Connection } from 'mongoose';

/** Контекст единицы работы. session задан только при активной транзакции. */
export type TxContext = { session?: ClientSession };

/**
 * Абстракция «единицы работы»: выполняет переданную функцию атомарно.
 * Потребители (напр. OrdersService) оборачивают группу записей в `run`,
 * прокидывая `ctx.session` в репозитории/контракты.
 */
export abstract class TransactionRunner {
    abstract run<T>(work: (ctx: TxContext) => Promise<T>): Promise<T>;
}

/** Признак того, что Mongo развёрнут НЕ как replica set (транзакции недоступны). */
function isTransactionsUnsupported(error: unknown): boolean {
    const code = (error as { code?: number })?.code;
    const message = (error as { message?: string })?.message ?? '';
    // 20 = IllegalOperation (standalone); либо явное сообщение драйвера.
    return (
        code === 20 ||
        /Transaction numbers are only allowed on a replica set|transactions are not supported|replica set/i.test(
            message,
        )
    );
}

/**
 * Реализация на Mongoose-сессии. В проде (replica set) оборачивает работу в
 * `session.withTransaction` (атомарность + откат). Если Mongo развёрнут как
 * standalone (dev), транзакции недоступны — деградируем до выполнения без сессии
 * (логируем один раз), чтобы не блокировать разработку.
 */
@Injectable()
export class MongoTransactionRunner extends TransactionRunner {
    private readonly logger = new Logger('TransactionRunner');
    private transactionsUnsupported = false;

    constructor(@InjectConnection() private readonly connection: Connection) {
        super();
    }

    async run<T>(work: (ctx: TxContext) => Promise<T>): Promise<T> {
        if (this.transactionsUnsupported) {
            return work({});
        }

        const session = await this.connection.startSession();
        try {
            let result: T | undefined;
            await session.withTransaction(async () => {
                result = await work({ session });
            });
            return result as T;
        } catch (error) {
            if (isTransactionsUnsupported(error)) {
                this.transactionsUnsupported = true;
                this.logger.warn(
                    'Mongo без replica set — транзакции отключены, выполняю без атомарности',
                );
                return work({});
            }
            throw error;
        } finally {
            await session.endSession();
        }
    }
}
