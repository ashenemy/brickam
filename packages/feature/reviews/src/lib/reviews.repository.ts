import { BaseRepository } from '@brickam/db-kit';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Review, type ReviewDocument } from './review.schema';

/** Репозиторий отзывов поверх Mongoose-модели Review (Foundations §7). */
@Injectable()
export class ReviewsRepository extends BaseRepository<Review> {
    constructor(@InjectModel(Review.name) model: Model<Review>) {
        super(model);
    }

    /** Находит отзыв по саб-заказу вендора (уникальный индекс vendorOrderId). */
    findByVendorOrder(vendorOrderId: string): Promise<ReviewDocument | null> {
        return this.findOne({ vendorOrderId });
    }

    /** Опубликованные отзывы вендора (для агрегата рейтинга вендора). */
    findPublishedByVendor(vendorId: string): Promise<ReviewDocument[]> {
        return this.find({ vendorId, status: 'published' });
    }

    /** Опубликованные отзывы товара (для агрегата рейтинга товара). */
    findPublishedByProduct(productId: string): Promise<ReviewDocument[]> {
        return this.find({ productId, status: 'published' });
    }
}
