import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { ExchangeRate, type ExchangeRateDocument } from './exchange-rate.schema';

/**
 * Репозиторий курсов валют поверх Mongoose-модели ExchangeRate (Foundations
 * §7, §11). Записи иммутабельны (история): актуальный курс — последний по
 * `fetchedAt`.
 */
@Injectable()
export class ExchangeRatesRepository extends BaseRepository<ExchangeRate> {
    constructor(@InjectModel(ExchangeRate.name) model: Model<ExchangeRate>) {
        super(model);
    }

    /** Последняя (самая свежая по fetchedAt) запись курса для валюты. */
    latestByCurrency(currency: string): Promise<ExchangeRateDocument | null> {
        return this.model
            .findOne({ currency })
            .sort({ fetchedAt: -1 })
            .exec() as Promise<ExchangeRateDocument | null>;
    }

    /**
     * По одной последней записи на каждую валюту. Группируем по `currency`,
     * берём документ с максимальным `fetchedAt`.
     */
    async latestAll(): Promise<ExchangeRateDocument[]> {
        const rows = await this.model
            .aggregate<{ doc: ExchangeRateDocument }>([
                { $sort: { fetchedAt: -1 } },
                { $group: { _id: '$currency', doc: { $first: '$$ROOT' } } },
            ])
            .exec();
        return rows.map((row) => row.doc);
    }
}
