import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { VendorMember, type VendorMemberDocument } from './vendor-member.schema';

/** Репозиторий членов команды вендора (Foundations §7). */
@Injectable()
export class VendorMembersRepository extends BaseRepository<VendorMember> {
    constructor(@InjectModel(VendorMember.name) model: Model<VendorMember>) {
        super(model);
    }

    /** Все члены команды вендора. */
    findByVendor(vendorId: string): Promise<VendorMemberDocument[]> {
        return this.find({ vendorId });
    }

    /** Член команды по паре {vendorId,userId} (уникальный индекс). */
    findByVendorUser(vendorId: string, userId: string): Promise<VendorMemberDocument | null> {
        return this.findOne({ vendorId, userId });
    }
}
