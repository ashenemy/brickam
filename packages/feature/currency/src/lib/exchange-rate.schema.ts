import { BASE_SCHEMA_OPTIONS, BaseSchema } from '@brickam/db-kit';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

/**
 * Курс валюты к базовой (AMD) — коллекция `exchange_rates` (Foundations §11,
 * §15). Записи не перезаписываются: каждое обновление добавляет новую строку,
 * актуальный курс — последний по `fetchedAt`. `rate` = сколько AMD за 1
 * единицу `currency` (например, 1 USD ≈ 390 AMD).
 */
@Schema({ ...BASE_SCHEMA_OPTIONS, collection: 'exchange_rates' })
export class ExchangeRate extends BaseSchema {
    /** Базовая валюта расчётов (всегда 'AMD'). */
    @Prop({ type: String, required: true, default: 'AMD' })
    base!: string;

    /** Код валюты отображения (USD/EUR/RUB...). */
    @Prop({ type: String, required: true, index: true })
    currency!: string;

    /** Сколько AMD за 1 единицу `currency`. */
    @Prop({ type: Number, required: true })
    rate!: number;

    /** Момент фиксации курса (для выбора последнего и истории). */
    @Prop({ type: Date, required: true })
    fetchedAt!: Date;

    /** Источник курса (имя провайдера, например 'cba'). */
    @Prop({ type: String, required: true })
    source!: string;
}

export type ExchangeRateDocument = HydratedDocument<ExchangeRate>;

export const ExchangeRateSchema = SchemaFactory.createForClass(ExchangeRate);

// История по валюте: последний курс — первый при сортировке fetchedAt desc.
ExchangeRateSchema.index({ currency: 1, fetchedAt: -1 });
