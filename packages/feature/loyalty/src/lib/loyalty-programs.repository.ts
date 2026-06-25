import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { LoyaltyProgram, type LoyaltyProgramDocument } from './loyalty-program.schema';

/** Репозиторий программ лояльности поверх Mongoose-модели (Foundations §7). */
@Injectable()
export class LoyaltyProgramsRepository extends BaseRepository<LoyaltyProgram> {
    constructor(@InjectModel(LoyaltyProgram.name) model: Model<LoyaltyProgram>) {
        super(model);
    }

    /** Активная программа лояльности (одновременно активна одна). */
    findActive(): Promise<LoyaltyProgramDocument | null> {
        return this.findOne({ active: true });
    }
}
