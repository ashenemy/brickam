import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Vendor, type VendorDocument } from './vendor.schema';

/** Репозиторий вендоров поверх Mongoose-модели Vendor (Foundations §7). */
@Injectable()
export class VendorsRepository extends BaseRepository<Vendor> {
    constructor(@InjectModel(Vendor.name) model: Model<Vendor>) {
        super(model);
    }

    /** Находит вендора по slug (уникальный индекс). */
    findBySlug(slug: string): Promise<VendorDocument | null> {
        return this.findOne({ slug });
    }

    /** Находит вендора по владельцу (ownerUserId). */
    findByOwner(ownerUserId: string): Promise<VendorDocument | null> {
        return this.findOne({ ownerUserId });
    }
}
