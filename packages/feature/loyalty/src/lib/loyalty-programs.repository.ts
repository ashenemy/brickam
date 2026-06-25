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

    /** Все программы (админ-конструктор), новые сверху. */
    findAllPrograms(): Promise<LoyaltyProgramDocument[]> {
        return this.find({}, { sort: { createdAt: -1 } }) as unknown as Promise<
            LoyaltyProgramDocument[]
        >;
    }

    /** Снимает флаг active со всех программ (перед активацией одной). */
    async deactivateAll(): Promise<void> {
        await this.model.updateMany({ active: true }, { $set: { active: false } }).exec();
    }

    /** Ставит флаг active программе по id. */
    setActive(id: string, active: boolean): Promise<LoyaltyProgramDocument | null> {
        return this.updateById(id, { active });
    }
}
