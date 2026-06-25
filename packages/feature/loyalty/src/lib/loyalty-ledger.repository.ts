import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { LoyaltyLedger, type LoyaltyLedgerDocument } from './loyalty-ledger.schema';

/** Репозиторий журнала начислений лояльности (Foundations §7). */
@Injectable()
export class LoyaltyLedgerRepository extends BaseRepository<LoyaltyLedger> {
    constructor(@InjectModel(LoyaltyLedger.name) model: Model<LoyaltyLedger>) {
        super(model);
    }

    /** Записи журнала покупателя (новые сверху). */
    findByUser(userId: string): Promise<LoyaltyLedgerDocument[]> {
        return this.find({ userId }, { sort: { createdAt: -1 } });
    }
}
