import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { AiJob, type AiJobDocument } from './ai-job.schema';

/** Репозиторий AI-задач поверх Mongoose-модели AiJob (Foundations §7). */
@Injectable()
export class AiJobsRepository extends BaseRepository<AiJob> {
    constructor(@InjectModel(AiJob.name) model: Model<AiJob>) {
        super(model);
    }

    /** Все AI-задачи вендора (новые сверху). */
    findByVendor(vendorId: string): Promise<AiJobDocument[]> {
        return this.find({ vendorId }, { sort: { createdAt: -1 } });
    }
}
