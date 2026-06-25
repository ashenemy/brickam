import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { DisputeStatus } from '../@types';
import { Dispute, type DisputeDocument } from './dispute.schema';

/** Репозиторий споров поверх Mongoose-модели Dispute (Foundations §7). */
@Injectable()
export class DisputesRepository extends BaseRepository<Dispute> {
    constructor(@InjectModel(Dispute.name) model: Model<Dispute>) {
        super(model);
    }

    /** Споры по статусу (для админ-листинга). */
    findByStatus(status: DisputeStatus): Promise<DisputeDocument[]> {
        return this.find({ status }, { sort: { at: -1 } });
    }

    /** Споры по вендору. */
    findByVendor(vendorId: string): Promise<DisputeDocument[]> {
        return this.find({ vendorId }, { sort: { at: -1 } });
    }
}
