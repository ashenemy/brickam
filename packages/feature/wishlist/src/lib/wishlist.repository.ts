import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Wishlist, type WishlistDocument } from './wishlist.schema';

/** Репозиторий вишлистов поверх Mongoose-модели Wishlist (Foundations §7). */
@Injectable()
export class WishlistRepository extends BaseRepository<Wishlist> {
    constructor(@InjectModel(Wishlist.name) model: Model<Wishlist>) {
        super(model);
    }

    /** Находит вишлист по пользователю (уникальный индекс userId). */
    findByUser(userId: string): Promise<WishlistDocument | null> {
        return this.findOne({ userId });
    }
}
