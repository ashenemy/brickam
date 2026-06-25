import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { AuditLog, type AuditLogDocument } from './audit-log.schema';

/** Репозиторий аудит-лога поверх Mongoose-модели AuditLog (Foundations §7). */
@Injectable()
export class AuditLogsRepository extends BaseRepository<AuditLog> {
    constructor(@InjectModel(AuditLog.name) model: Model<AuditLog>) {
        super(model);
    }

    /** Последние записи аудита (по убыванию времени события). */
    findRecent(limit: number): Promise<AuditLogDocument[]> {
        return this.model.find().sort({ at: -1 }).limit(limit).exec();
    }
}
