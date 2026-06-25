import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { PlatformSettings, type PlatformSettingsDocument } from './platform-settings.schema';

/**
 * Репозиторий настроек платформы поверх коллекции platform_settings
 * (Foundations §13). Доступ по уникальному ключу.
 */
@Injectable()
export class PlatformSettingsRepository {
    constructor(
        @InjectModel(PlatformSettings.name)
        private readonly model: Model<PlatformSettings>,
    ) {}

    /** Находит настройку по уникальному ключу (null если нет). */
    findByKey(key: string): Promise<PlatformSettingsDocument | null> {
        return this.model.findOne({ key }).exec();
    }

    /** Создаёт/обновляет настройку по ключу (upsert документа platform_settings). */
    async upsertByKey(key: string, value: Record<string, unknown>): Promise<void> {
        await this.model.updateOne({ key }, { $set: { key, value } }, { upsert: true }).exec();
    }
}
